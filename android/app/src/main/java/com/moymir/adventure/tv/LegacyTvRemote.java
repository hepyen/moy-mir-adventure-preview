package com.moymir.adventure.tv;

import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;


/** Local, user-authorized Samsung legacy remote protocol. No firmware changes. */
public final class LegacyTvRemote {
    private static final byte[] GRANTED={100,0,1,0}, DENIED={100,0,0,0}, ACCEPTED={0,0,0,0};
    public static boolean privateIpv4(String address) {
        if(address==null || !address.matches("[0-9]{1,3}(\\.[0-9]{1,3}){3}")) return false;
        String[] p=address.split("\\."); int[] a=new int[4];
        for(int i=0;i<4;i++){a[i]=Integer.parseInt(p[i]);if(a[i]>255 || (p[i].length()>1 && p[i].startsWith("0")))return false;}
        return a[3]>0 && a[3]<255 && (a[0]==10 || a[0]==192 && a[1]==168 || a[0]==172 && a[1]>=16 && a[1]<=31);
    }
    private static byte[] base64(byte[] v){
        String alphabet="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        StringBuilder s=new StringBuilder();
        for(int i=0;i<v.length;i+=3){int a=v[i]&255,b=i+1<v.length?v[i+1]&255:0,c=i+2<v.length?v[i+2]&255:0;int n=(a<<16)|(b<<8)|c;s.append(alphabet.charAt(n>>18)).append(alphabet.charAt((n>>12)&63)).append(i+1<v.length?alphabet.charAt((n>>6)&63):'=').append(i+2<v.length?alphabet.charAt(n&63):'=');}
        return s.toString().getBytes(StandardCharsets.US_ASCII);
    }
    private static byte[] field(byte[] value,boolean encode) throws IOException {
        byte[] b=encode?base64(value):value;
        if(b.length>4096)throw new IOException("Invalid field");
        ByteArrayOutputStream out=new ByteArrayOutputStream();out.write(b.length&255);out.write(b.length>>8);out.write(b);return out.toByteArray();
    }
    private static byte[] text(String v) throws IOException{return field(v.getBytes(StandardCharsets.UTF_8),true);}
    private static byte[] join(byte[]... fields) throws IOException{ByteArrayOutputStream b=new ByteArrayOutputStream();for(byte[] f:fields)b.write(f);return b.toByteArray();}
    private static void send(OutputStream out,byte[] payload)throws IOException{out.write(join(new byte[]{0},field(new byte[0],false),field(payload,false)));out.flush();}
    private static byte[] readField(DataInputStream in)throws IOException{int n=in.readUnsignedByte()|(in.readUnsignedByte()<<8);if(n>4096)throw new IOException("Invalid TV response");byte[] b=new byte[n];in.readFully(b);return b;}
    private static void reply(DataInputStream in,boolean auth)throws IOException{
        long deadline=System.nanoTime()+30_000_000_000L;
        for(int i=0;i<20&&System.nanoTime()<deadline;i++){
            in.readUnsignedByte();readField(in);byte[] p=readField(in);
            if(auth&&Arrays.equals(p,GRANTED)||!auth&&Arrays.equals(p,ACCEPTED))return;
            if(Arrays.equals(p,DENIED)||p.length>0&&p[0]==101)throw new IOException("Телевизор отклонил разрешение");
            if(auth&&p.length>0&&p[0]==10)continue;
            throw new IOException("Телевизор вернул неподдерживаемый ответ");
        }
        throw new SocketTimeoutException("Разрешение на телевизоре не подтверждено");
    }
    static void exchange(Socket socket,String remoteId,String command)throws IOException{
        DataInputStream in=new DataInputStream(socket.getInputStream());OutputStream out=socket.getOutputStream();
        send(out,join(new byte[]{100,0},text("My World"),text(remoteId),text("My World TV")));
        reply(in,true);
        if(!"pair".equals(command)){
            String key;
            switch(command){case "off":key="KEY_POWEROFF";break;case "source":key="KEY_SOURCE";break;default:throw new IOException("Unknown command");}
            send(out,join(new byte[]{0,0,0},text(key)));reply(in,false);
        }
    }
    public static void run(String ip,String remoteId,String command)throws IOException{runTimed(ip,remoteId,command,3000,12000);}
    public static void runTimed(String ip,String remoteId,String command,int connectTimeout,int readTimeout)throws IOException{
        if(!privateIpv4(ip))throw new IOException("Укажи локальный IPv4 телевизора");
        if(!Arrays.asList("pair","off","source").contains(command))throw new IOException("Unknown command");
        try(Socket socket=new Socket()){socket.connect(new InetSocketAddress(ip,55000),connectTimeout);socket.setSoTimeout(readTimeout);java.util.Timer timer=new java.util.Timer(true);timer.schedule(new java.util.TimerTask(){public void run(){try{socket.close();}catch(IOException ignored){}}},readTimeout<=3500?6500:30000);try{exchange(socket,remoteId,command);}finally{timer.cancel();}}
    }
}

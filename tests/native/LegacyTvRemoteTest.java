package com.moymir.adventure.tv;
import java.io.*;
import java.net.*;
import java.util.Arrays;
import java.util.concurrent.*;
public class LegacyTvRemoteTest {
 static byte[] frame(DataInputStream in)throws IOException{in.readUnsignedByte();int n=in.readUnsignedByte()|(in.readUnsignedByte()<<8);in.readFully(new byte[n]);n=in.readUnsignedByte()|(in.readUnsignedByte()<<8);byte[] b=new byte[n];in.readFully(b);return b;}
 static void response(OutputStream out,byte[] p)throws IOException{out.write(new byte[]{0,0,0,(byte)p.length,0});out.write(p);out.flush();}
 static void test(String action,boolean allowed)throws Exception{
  try(ServerSocket server=new ServerSocket(0,1,InetAddress.getLoopbackAddress())){
   ExecutorService ex=Executors.newSingleThreadExecutor();
   Future<?> f=ex.submit(()->{try(Socket s=server.accept()){
     s.setSoTimeout(2500);DataInputStream in=new DataInputStream(s.getInputStream());OutputStream out=s.getOutputStream();
     byte[] auth=frame(in);if(auth[0]!=100||auth[1]!=0)throw new AssertionError("bad auth");
     response(out,new byte[]{10,0});response(out,new byte[]{100,0,(byte)(allowed?1:0),0});
     if(allowed&&!action.equals("pair")){byte[] b=frame(in);String key=new String(java.util.Base64.getDecoder().decode(Arrays.copyOfRange(b,5,b.length)));if(!key.equals(action.equals("off")?"KEY_POWEROFF":"KEY_SOURCE"))throw new AssertionError(key);response(out,new byte[]{0,0,0,0});}
     else if(in.read()!=-1)throw new AssertionError("unexpected command");
   }catch(Exception e){throw new RuntimeException(e);}});
   boolean ok=false;
   try(Socket client=new Socket(InetAddress.getLoopbackAddress(),server.getLocalPort())){client.setSoTimeout(2500);LegacyTvRemote.exchange(client,"test",action);ok=true;}catch(IOException e){if(allowed)throw e;}
   if(ok!=allowed)throw new AssertionError("permission");
   f.get(4,TimeUnit.SECONDS);ex.shutdown();
  }
 }
 public static void main(String[] args)throws Exception{
  if(!LegacyTvRemote.privateIpv4("192.168.1.144")||LegacyTvRemote.privateIpv4("8.8.8.8")||LegacyTvRemote.privateIpv4("192.168.1.999")||LegacyTvRemote.privateIpv4("localhost"))throw new AssertionError("IP validation");
  test("pair",true);test("off",true);test("source",true);test("off",false);
  System.out.println("PASS private IP validation, pairing, power off, source, denied access sends no command");
 }
}

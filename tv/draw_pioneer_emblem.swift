import AppKit
import Foundation

func rgb(_ hex:UInt32,_ alpha:CGFloat=1)->NSColor{
 return NSColor(calibratedRed:CGFloat((hex>>16)&255)/255,green:CGFloat((hex>>8)&255)/255,blue:CGFloat(hex&255)/255,alpha:alpha)
}
func png(_ picture:NSImage,_ destination:String){
 guard let tiff=picture.tiffRepresentation,let bmp=NSBitmapImageRep(data:tiff),
 let bytes=bmp.representation(using:.png,properties:[:]) else {fatalError("Cannot export")}
 try! bytes.write(to:URL(fileURLWithPath:destination))
}
func star(_ x:CGFloat,_ y:CGFloat,_ outer:CGFloat,_ inner:CGFloat)->NSBezierPath{
 let p=NSBezierPath()
 for i in 0..<10{
  let theta=CGFloat(i)*CGFloat.pi/5 + CGFloat.pi/2
  let rad=i%2==0 ? outer:inner
  let point=NSPoint(x:x+cos(theta)*rad,y:y+sin(theta)*rad)
  if i==0{p.move(to:point)}else{p.line(to:point)}
 }
 p.close();return p
}
func drawIcon(_ size:CGFloat)->NSImage{
 let picture=NSImage(size:NSSize(width:size,height:size))
 picture.lockFocus()
 let scale=size/512
 let transform=NSAffineTransform();transform.scale(by:scale)
 transform.concat()
 let outline=NSBezierPath(roundedRect:NSRect(x:0,y:0,width:512,height:512),xRadius:120,yRadius:120)
 NSGradient(starting:rgb(0x233e8d),ending:rgb(0x071129))!.draw(in:outline,angle:115)
 let radiant=NSBezierPath(ovalIn:NSRect(x:44,y:48,width:424,height:424))
 radiant.lineWidth=10;rgb(0xd7a64c).setStroke();radiant.stroke()
 let radiant2=NSBezierPath(ovalIn:NSRect(x:60,y:64,width:392,height:392))
 radiant2.lineWidth=3;rgb(0xffe7a3,0.75).setStroke();radiant2.stroke()
 for i in 0..<24{
  let angle=CGFloat(i)*CGFloat.pi/12
  let cx:CGFloat=256,cy:CGFloat=257
  let x1=cx+cos(angle)*219,y1=cy+sin(angle)*219
  let x2=cx+cos(angle)*229,y2=cy+sin(angle)*229
  let p=NSBezierPath();p.move(to:NSPoint(x:x1,y:y1));p.line(to:NSPoint(x:x2,y:y2))
  p.lineWidth=2.5;rgb(0xffdf97).setStroke();p.stroke()
 }
 // Gold rising star behind the book.
 let mainStar=star(256,327,80,40)
 let shadow=NSShadow();shadow.shadowBlurRadius=34;shadow.shadowColor=rgb(0xffda82,0.8);shadow.shadowOffset=NSSize(width:0,height:0)
 NSGraphicsContext.saveGraphicsState();shadow.set()
 NSGradient(starting:rgb(0xfff3bf),ending:rgb(0xe49b38))!.draw(in:mainStar,angle:80)
 NSGraphicsContext.restoreGraphicsState()
 mainStar.lineWidth=2;rgb(0xfff6d9).setStroke();mainStar.stroke()
 // Pages of an open book, made with four cubic curves.
 let left=NSBezierPath()
 left.move(to:NSPoint(x:98,y:211))
 left.curve(to:NSPoint(x:247,y:196),controlPoint1:NSPoint(x:152,y:226),controlPoint2:NSPoint(x:206,y:222))
 left.line(to:NSPoint(x:247,y:115))
 left.curve(to:NSPoint(x:99,y:136),controlPoint1:NSPoint(x:190,y:138),controlPoint2:NSPoint(x:147,y:155))
 left.close()
 NSGradient(starting:rgb(0xfffbec),ending:rgb(0xe6d3a4))!.draw(in:left,angle:90)
 let right=NSBezierPath()
 right.move(to:NSPoint(x:265,y:196))
 right.curve(to:NSPoint(x:415,y:211),controlPoint1:NSPoint(x:311,y:223),controlPoint2:NSPoint(x:365,y:226))
 right.line(to:NSPoint(x:414,y:136))
 right.curve(to:NSPoint(x:265,y:115),controlPoint1:NSPoint(x:370,y:156),controlPoint2:NSPoint(x:315,y:140))
 right.close()
 NSGradient(starting:rgb(0xffffff),ending:rgb(0xe6d0a0))!.draw(in:right,angle:95)
 // Page binding and soft internal page lines.
 let binding=NSBezierPath();binding.move(to:NSPoint(x:256,y:112));binding.line(to:NSPoint(x:256,y:205))
 binding.lineWidth=5;rgb(0xc48c39).setStroke();binding.stroke()
 for i in 0..<4{
  let y=166-CGFloat(i)*13
  let li=NSBezierPath();li.move(to:NSPoint(x:123,y:y+12))
  li.curve(to:NSPoint(x:226,y:y),controlPoint1:NSPoint(x:154,y:y+16),controlPoint2:NSPoint(x:197,y:y+6))
  li.lineWidth=2;rgb(0xad9b81,0.65).setStroke();li.stroke()
  let ri=NSBezierPath();ri.move(to:NSPoint(x:286,y:y))
  ri.curve(to:NSPoint(x:389,y:y+12),controlPoint1:NSPoint(x:326,y:y+6),controlPoint2:NSPoint(x:362,y:y+16))
  ri.lineWidth=2;rgb(0xad9b81,0.65).setStroke();ri.stroke()
 }
 // A six-point accomplishment path along the bottom (six stages).
 for i in 0..<6{
  let r=NSBezierPath(ovalIn:NSRect(x:183+CGFloat(i)*27,y:79,width:10,height:10))
  rgb(0xffdc85).setFill();r.fill()
 }
 picture.unlockFocus()
 return picture
}
func drawBanner(_ logo:NSImage)->NSImage{
 let width:CGFloat=640,height:CGFloat=360
 let image=NSImage(size:NSSize(width:width,height:height));image.lockFocus()
 NSGradient(starting:rgb(0x091332),ending:rgb(0x244a97))!.draw(in:NSRect(x:0,y:0,width:width,height:height),angle:15)
 let glow=NSBezierPath(ovalIn:NSRect(x:-25,y:-40,width:395,height:395))
 glow.lineWidth=3;rgb(0xf7cd7e,0.34).setStroke();glow.stroke()
 logo.draw(in:NSRect(x:22,y:30,width:300,height:300))
 func label(_ t:String,x:CGFloat,y:CGFloat,size:CGFloat, color:NSColor){
  let attributes:[NSAttributedString.Key:Any]=[.font:NSFont.systemFont(ofSize:size,weight:.heavy),.foregroundColor:color,.kern:0.1]
  t.draw(at:NSPoint(x:x,y:y),withAttributes:attributes)
 }
 label("КТО ХОЧЕТ",x:335,y:251,size:29,color:.white)
 label("СТАТЬ",x:335,y:190,size:49,color:.white)
 label("ПИОНЕРОМ?",x:335,y:143,size:32,color:rgb(0xffd989))
 label("БИБЛЕЙСКАЯ",x:336,y:91,size:17,color:rgb(0xb4c9f9))
 label("ВИКТОРИНА",x:336,y:65,size:17,color:rgb(0xb4c9f9))
 image.unlockFocus();return image
}
let folder=CommandLine.arguments[1]
let logo=drawIcon(512)
png(logo,folder+"/src/pioneer/pioneer_emblem.png")
let banner=drawBanner(logo)
png(banner,folder+"/tv/android/app/src/main/res/drawable/tv_banner.png")


import AppKit
func save(_ image: NSImage, _ path: String) {
  guard let tiff=image.tiffRepresentation, let rep=NSBitmapImageRep(data:tiff),
        let data=rep.representation(using:.png,properties:[:]) else { fatalError("PNG conversion failed") }
  try! data.write(to:URL(fileURLWithPath:path))
}
let w:CGFloat=640,h:CGFloat=360
let image=NSImage(size:NSSize(width:w,height:h))
image.lockFocus()
NSGradient(starting:NSColor(calibratedRed:0.05,green:0.08,blue:0.24,alpha:1),
           ending:NSColor(calibratedRed:0.17,green:0.25,blue:0.58,alpha:1))!.draw(in:NSRect(x:0,y:0,width:w,height:h),angle:15)
NSColor(calibratedRed:0.84,green:0.71,blue:0.42,alpha:1).setStroke()
let ring=NSBezierPath(ovalIn:NSRect(x:38,y:45,width:270,height:270));ring.lineWidth=12;ring.stroke()
let ring2=NSBezierPath(ovalIn:NSRect(x:60,y:67,width:226,height:226));ring2.lineWidth=3;ring2.stroke()
let attrs:[NSAttributedString.Key:Any]=[
 .font:NSFont.boldSystemFont(ofSize:108),
 .foregroundColor:NSColor(calibratedRed:0.99,green:0.88,blue:0.58,alpha:1)
]
"✦".draw(at:NSPoint(x:119,y:114),withAttributes:attrs)
func draw(_ text:String, _ y:CGFloat,_ size:CGFloat,_ color:NSColor){
 let a:[NSAttributedString.Key:Any]=[.font:NSFont.boldSystemFont(ofSize:size),.foregroundColor:color]
 text.draw(at:NSPoint(x:340,y:y),withAttributes:a)
}
draw("КТО ХОЧЕТ",252,31,.white)
draw("СТАТЬ",196,47,.white)
draw("ПИОНЕРОМ?",131,34,NSColor(calibratedRed:0.99,green:0.86,blue:0.55,alpha:1))
draw("БИБЛЕЙСКАЯ ВИКТОРИНА",82,15,NSColor(calibratedRed:0.78,green:0.83,blue:0.99,alpha:1))
image.unlockFocus()
save(image,CommandLine.arguments[1])


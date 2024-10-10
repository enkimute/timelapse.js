/**
 * timelapse.js - webm retiming 
 * @author Enki
 * @desc Little script that can binary change the framerate of a webM video.
 */
(function (name, context, definition) {
  if (typeof module != 'undefined' && module.exports) module.exports = definition();
  else if (typeof define == 'function' && define.amd) define(name, definition);
  else context[name] = definition();
}('timelapse', this, function () {
  var data, pos, framecount, clusterFrame, tail=Array.apply([],{length:256}).map(function(x,i){return 7-Math.max(0,Math.floor(Math.log2(i)))});
  function vint() { var byte=data[pos++], nrBytes = tail[byte], res=byte&(255>>(nrBytes+1)); while (nrBytes--) res=res*256+data[pos++]; return res; }
  return function timelapse(blob, fps, complete) {
    var fr = new FileReader();
    fr.onload = function() {
      data = new Uint8Array(this.result);
      pos = framecount = 0, clusterFrame = 0;
      while (pos < data.byteLength) {
        var elementID = vint(), elementSize = vint();
        switch(elementID) {
          case 0x67: var nts=Math.round(1000/fps*framecount); while (elementSize--) data[pos++]=(nts>>(elementSize*8))&255; clusterFrame=0; break;
          case 0x21: var nts=Math.round(1000/fps*clusterFrame); data[pos+1]=nts>>8; data[pos+2]=nts&255; pos+=elementSize; framecount++; clusterFrame++; break;
          default : if (elementSize != 72057594037927940 && elementID != 0x20) pos += elementSize; 
        }
      }
      complete&&complete(new Blob([data],{type:'video/webm'}));
    };
    if (blob instanceof Array) blob=new Blob(blob,{type:'video/webm'});
    fr.readAsArrayBuffer(blob);
  }
}));

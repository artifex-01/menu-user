import React, { useRef, useEffect, useState, useCallback } from 'react';
import jsQR from 'https://esm.sh/jsqr';
import { Zap, ZapOff, RefreshCw, VideoOff, X, ScanLine } from 'lucide-react';

interface QRScannerProps {
  onScan: (code: string) => void;
  isScanning: boolean;
  isFullScreen?: boolean;
  onClose?: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, isScanning, isFullScreen = false, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const startCamera = useCallback(async () => {
    // Reset state
    setHasPermission(null);
    setErrorMsg("");

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMsg("Camera API not supported in this browser");
      setHasPermission(false);
      return;
    }

    try {
      let stream: MediaStream | null = null;
      
      // Strategy 1: Environment (Rear) Camera with ideal resolution
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
      } catch (e) {
        console.debug("Ideal environment constraints failed, attempting fallback 1...");
      }

      // Strategy 2: Environment Camera without resolution constraints
      if (!stream) {
          try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" }
            });
          } catch (e) {
            console.debug("Environment facing mode failed, attempting fallback 2...");
          }
      }

      // Strategy 3: User (Front) Camera as backup 
      if (!stream) {
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user" }
            });
        } catch (e) {
             console.debug("User facing mode failed, attempting fallback 3...");
        }
      }

      // Strategy 4: Any video device
      if (!stream) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true
          });
      }

      // If component unmounted during async call or scanning stopped
      if (!isScanning) {
        if (stream) stream.getTracks().forEach(track => track.stop());
        return;
      }

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true"); 
        await videoRef.current.play();
      }
      
      setHasPermission(true);
    } catch (err: any) {
      console.error("Camera access failed:", err);
      // Determine user friendly error
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
         setErrorMsg("Permission denied. Please allow camera access in your browser settings.");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
         setErrorMsg("No camera device found on your device.");
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
         setErrorMsg("Camera is in use by another application.");
      } else {
         setErrorMsg(err.message || "Unable to access camera.");
      }
      setHasPermission(false);
    }
  }, [isScanning]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setTorchOn(false);
  }, []);

  useEffect(() => {
    let mounted = true;
    
    if (isScanning) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      mounted = false;
      stopCamera();
    };
  }, [isScanning, startCamera, stopCamera]);

  // Toggle Flash
  const toggleFlash = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    const capabilities = track.getCapabilities ? track.getCapabilities() : {};
    
    // @ts-ignore
    if (!capabilities.torch && !('fillLightMode' in capabilities)) {
        return;
    }

    try {
      await track.applyConstraints({
        advanced: [{ torch: !torchOn } as any]
      });
      setTorchOn(!torchOn);
    } catch (e) {
      console.error("Failed to toggle flash", e);
    }
  };

  // Scan Loop
  useEffect(() => {
    let animationFrameId: number;

    const tick = () => {
      if (
        videoRef.current &&
        videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA &&
        canvasRef.current
      ) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (ctx) {
          canvas.height = video.videoHeight;
          canvas.width = video.videoWidth;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          try {
              const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
              });
    
              if (code && code.data) {
                onScan(code.data);
              }
          } catch (e) {
             // scan error
          }
        }
      }
      animationFrameId = requestAnimationFrame(tick);
    };

    if (isScanning && hasPermission) {
      animationFrameId = requestAnimationFrame(tick);
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [isScanning, hasPermission, onScan]);

  if (hasPermission === false) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-black text-gray-300 p-10 text-center relative z-50 animate-in fade-in duration-300">
        {onClose && (
            <button 
                onClick={onClose}
                className="absolute top-safe-top left-6 p-3 bg-white/10 rounded-full text-white hover:bg-white/20 active:scale-95 transition-all"
            >
                <X className="w-6 h-6" />
            </button>
        )}

        <div className="w-24 h-24 bg-zinc-800 rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl ring-1 ring-white/5">
            <VideoOff className="w-10 h-10 text-white/40" />
        </div>
        
        <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">Camera Unavailable</h3>
        
        <p className="text-base opacity-70 leading-relaxed max-w-sm mx-auto mb-10">
          {errorMsg || "We couldn't access your camera. Please check permissions."}
        </p>
        
        <button 
          onClick={() => startCamera()}
          className="flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full font-bold text-base active:scale-95 transition-transform hover:bg-gray-100"
        >
          <RefreshCw className="w-5 h-5" />
          Retry Camera
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-black touch-none">
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Video Feed */}
      <video 
        ref={videoRef} 
        className="absolute inset-0 w-full h-full object-cover" 
        muted 
        autoPlay
        playsInline
      />

      {/* Darkened Overlay */}
      <div className="absolute inset-0 bg-black/50 pointer-events-none"></div>
      
      {/* Cutout / Focus Area - Using CSS mask for cleaner cutout effect */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
         <div className="relative w-72 h-72 rounded-[2.5rem] shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] overflow-hidden">
             {/* Scanner Corners - Orange */}
             <div className="absolute top-0 left-0 w-20 h-20 border-t-[5px] border-l-[5px] border-orange-500 rounded-tl-[2.2rem]"></div>
             <div className="absolute top-0 right-0 w-20 h-20 border-t-[5px] border-r-[5px] border-orange-500 rounded-tr-[2.2rem]"></div>
             <div className="absolute bottom-0 left-0 w-20 h-20 border-b-[5px] border-l-[5px] border-orange-500 rounded-bl-[2.2rem]"></div>
             <div className="absolute bottom-0 right-0 w-20 h-20 border-b-[5px] border-r-[5px] border-orange-500 rounded-br-[2.2rem]"></div>
             
             {/* Scan Line Animation */}
             <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-500/20 to-transparent animate-scan-fast"></div>
         </div>
      </div>

      {/* Controls UI - Top */}
      <div className="absolute top-0 left-0 right-0 p-5 pt-safe-top flex justify-between items-start z-30">
        {onClose && (
            <button 
                onClick={onClose}
                className="w-12 h-12 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white active:scale-90 transition-all hover:bg-black/60 shadow-lg"
            >
                <X className="w-6 h-6" />
            </button>
        )}
        
        {/* Flash Toggle */}
        <button 
           onClick={toggleFlash}
           className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-md border ml-auto shadow-lg active:scale-90 ${torchOn ? 'bg-orange-500 text-white border-orange-400' : 'bg-black/40 text-white border-white/10 hover:bg-black/60'}`}
         >
           {torchOn ? <Zap className="w-5 h-5 fill-current" /> : <ZapOff className="w-5 h-5" />}
         </button>
      </div>

      {/* Instructions - Bottom */}
      <div className="absolute bottom-16 left-0 right-0 z-20 flex flex-col items-center pointer-events-none px-6">
        <div className="bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 shadow-lg">
           <p className="text-white font-semibold text-sm tracking-wide flex items-center gap-2">
             <ScanLine className="w-4 h-4 text-orange-400" />
             Align QR code within the frame
           </p>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
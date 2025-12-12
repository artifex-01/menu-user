import React, { useRef, useEffect, useState, useCallback } from 'react';
import jsQR from 'https://esm.sh/jsqr';
import { ScanLine, Zap, ZapOff, RefreshCw, Camera } from 'lucide-react';

interface QRScannerProps {
  onScan: (code: string) => void;
  isScanning: boolean;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, isScanning }) => {
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
      // Try with environment facing mode first (phones)
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
      } catch (err) {
        console.warn("Environment camera failed, trying fallback...", err);
        // Fallback to any video source (desktop webcam)
        stream = await navigator.mediaDevices.getUserMedia({
          video: true
        });
      }

      // If component unmounted during async call or scanning stopped
      if (!isScanning) {
        stream.getTracks().forEach(track => track.stop());
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
      } else if (err.name === 'NotFoundError') {
         setErrorMsg("No camera device found.");
      } else {
         setErrorMsg("Unable to access camera. " + (err.message || ""));
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
    
    // Check capability
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
        const ctx = canvas.getContext('2d');

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
      <div className="flex flex-col items-center justify-center h-full bg-zinc-900/95 backdrop-blur-sm text-gray-300 p-10 text-center relative z-20 animate-in fade-in duration-500">
        
        {/* Larger Icon Container */}
        <div className="w-24 h-24 bg-zinc-800/80 rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl ring-1 ring-white/5">
            <Camera className="w-12 h-12 text-white/50" />
        </div>
        
        {/* Larger Typography */}
        <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">Camera Access Needed</h3>
        
        <p className="text-base opacity-70 leading-relaxed max-w-sm mx-auto mb-10">
          {errorMsg || "To scan menus, please enable camera permissions in your browser settings."}
        </p>
        
        {/* Larger Button */}
        <button 
          onClick={() => startCamera()}
          className="flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full font-bold text-base active:scale-95 transition-transform hover:bg-gray-100 shadow-[0_0_20px_rgba(255,255,255,0.15)]"
        >
          <RefreshCw className="w-5 h-5" />
          Retry Camera
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      <canvas ref={canvasRef} className="hidden" />
      
      <video 
        ref={videoRef} 
        className="absolute inset-0 w-full h-full object-cover opacity-90" 
        muted 
        autoPlay
        playsInline
      />

      {/* Clean Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.6)_100%)] pointer-events-none"></div>

      {/* Center UI */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
        
        {/* Minimalist Scan Frame */}
        <div className="relative w-64 h-64 mb-16 rounded-[2rem] border border-white/30 shadow-2xl overflow-hidden">
             {/* Glowing corners */}
            <div className="absolute top-0 left-0 w-16 h-16 border-t-[3px] border-l-[3px] border-white rounded-tl-[1.8rem]"></div>
            <div className="absolute top-0 right-0 w-16 h-16 border-t-[3px] border-r-[3px] border-white rounded-tr-[1.8rem]"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 border-b-[3px] border-l-[3px] border-white rounded-bl-[1.8rem]"></div>
            <div className="absolute bottom-0 right-0 w-16 h-16 border-b-[3px] border-r-[3px] border-white rounded-br-[1.8rem]"></div>
            
            {/* Subtle Scan Line */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-transparent animate-scan-fast"></div>
            <div className="absolute top-1/2 w-full h-[1px] bg-white/50 shadow-[0_0_20px_white] animate-scan-line"></div>
        </div>

        {/* Floating Instruction */}
        <div className="bg-black/40 backdrop-blur-md px-5 py-2 rounded-full border border-white/10 shadow-lg">
           <p className="text-white/90 font-medium text-sm tracking-wide">
             Point at table QR code
           </p>
        </div>
      </div>

      {/* Flash Control */}
      <div className="absolute bottom-36 right-6 z-20 pointer-events-auto">
         <button 
           onClick={toggleFlash}
           className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-md border ${torchOn ? 'bg-white text-orange-500 border-white shadow-[0_0_20px_rgba(255,255,255,0.4)]' : 'bg-black/30 text-white border-white/20 hover:bg-black/50'}`}
         >
           {torchOn ? <Zap className="w-5 h-5 fill-current" /> : <ZapOff className="w-5 h-5" />}
         </button>
      </div>
    </div>
  );
};

export default QRScanner;
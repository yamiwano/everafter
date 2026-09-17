"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Camera,
  SwitchCamera,
  X,
  Check,
  Loader2,
  ImagePlus,
  CameraOff,
  Zap,
  ZapOff,
} from "lucide-react";

type CameraState = "starting" | "live" | "denied" | "unavailable";

export function CameraCapture({
  slug,
  disabled,
  shotsUsed,
  shotsTotal,
  onUploaded,
  onError,
}: {
  slug: string;
  disabled: boolean;
  shotsUsed: number;
  shotsTotal: number;
  onUploaded: (photo: { id: string; thumbUrl: string }) => void;
  onError: (message: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cameraState, setCameraState] = useState<CameraState>("starting");
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [preview, setPreview] = useState<{ blob: Blob; url: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [flash, setFlash] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(
    async (facingMode: "environment" | "user") => {
      stopStream();
      setCameraState("starting");
      setTorchOn(false);
      setTorchSupported(false);
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraState("unavailable");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 2048 },
            height: { ideal: 2048 },
          },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        const track = stream.getVideoTracks()[0];
        const caps = track?.getCapabilities?.() as
          | (MediaTrackCapabilities & { torch?: boolean })
          | undefined;
        setTorchSupported(Boolean(caps?.torch));
        setCameraState("live");
      } catch (err) {
        setCameraState(
          err instanceof DOMException && err.name === "NotAllowedError"
            ? "denied"
            : "unavailable",
        );
      }
    },
    [stopStream],
  );

  useEffect(() => {
    const kickoff = setTimeout(() => startCamera(facing), 0);
    return () => {
      clearTimeout(kickoff);
      stopStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flipCamera = () => {
    const next = facing === "environment" ? "user" : "environment";
    setFacing(next);
    startCamera(next);
  };

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track || !torchSupported) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({
        // @ts-expect-error torch is a non-standard constraint supported on many mobile browsers
        advanced: [{ torch: next }],
      });
      setTorchOn(next);
    } catch {
      setTorchSupported(false);
    }
  };

  const capture = () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;
    setFlash(true);
    setTimeout(() => setFlash(false), 180);
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;
    if (facing === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (blob) setPreview({ blob, url: URL.createObjectURL(blob) });
      },
      "image/jpeg",
      0.92,
    );
  };

  const handleFile = (file: File | undefined | null) => {
    if (!file) return;
    setPreview({ blob: file, url: URL.createObjectURL(file) });
  };

  const discardPreview = () => {
    if (preview) URL.revokeObjectURL(preview.url);
    setPreview(null);
  };

  const upload = async () => {
    if (!preview) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("photo", preview.blob, "capture.jpg");
      const res = await fetch(`/api/w/${slug}/photos`, {
        method: "POST",
        body: form,
      });
      const json = await res.json();
      if (!res.ok) {
        onError(json.error ?? "Upload failed — try again.");
        return;
      }
      discardPreview();
      onUploaded(json.photo);
    } catch {
      onError("Upload failed. Check your connection and try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-[1.75rem] bg-black shadow-[0_30px_60px_-28px_rgba(0,0,0,0.65)]">
      <div className="relative aspect-[3/4]">
        <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 pt-4">
          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md transition hover:bg-black/50"
            onClick={() => fileInputRef.current?.click()}
            title="Upload from camera roll"
          >
            <ImagePlus className="size-4.5" strokeWidth={1.5} />
          </button>
          <div className="flex items-center gap-1.5 rounded-full bg-black/40 px-3.5 py-1.5 text-xs font-medium text-white/95 backdrop-blur-md">
            <Camera className="size-3.5" strokeWidth={1.75} />
            {shotsUsed} / {shotsTotal}
          </div>
          <div className="size-10" aria-hidden />
        </div>

        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`absolute inset-0 size-full object-cover ${
            facing === "user" ? "-scale-x-100" : ""
          } ${preview || cameraState !== "live" ? "invisible" : ""}`}
        />

        {flash && (
          <div className="absolute inset-0 z-30 animate-shutter bg-white" />
        )}

        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview.url}
            alt="Your captured photo"
            className="absolute inset-0 size-full object-cover"
          />
        )}

        {!preview && cameraState !== "live" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#12100e] px-8 text-center">
            {cameraState === "starting" ? (
              <Loader2 className="size-7 animate-spin text-white/70" />
            ) : (
              <>
                <CameraOff className="size-8 text-white/60" strokeWidth={1.25} />
                <p className="text-sm text-white/80">
                  {cameraState === "denied"
                    ? "Camera access was denied. You can still add photos from your camera roll."
                    : "The camera isn't available here. Add photos from your camera roll instead."}
                </p>
                <Button
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus className="size-4" /> Choose a photo
                </Button>
                {cameraState === "denied" && (
                  <button
                    className="text-xs text-white/60 underline underline-offset-4"
                    onClick={() => startCamera(facing)}
                  >
                    Try the camera again
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {!preview && cameraState === "live" && (
          <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between bg-gradient-to-t from-black/80 via-black/30 to-transparent px-8 pt-20 pb-7">
            <button
              type="button"
              className="flex size-11 items-center justify-center rounded-full bg-white/12 text-white backdrop-blur transition hover:bg-white/20 disabled:opacity-35"
              onClick={toggleTorch}
              disabled={!torchSupported}
              title={torchSupported ? "Toggle flash" : "Flash unavailable"}
            >
              {torchOn ? (
                <Zap className="size-5 fill-snap-orange text-snap-orange" strokeWidth={1.5} />
              ) : (
                <ZapOff className="size-5" strokeWidth={1.5} />
              )}
            </button>
            <button
              onClick={capture}
              disabled={disabled}
              title="Take photo"
              className="flex size-[4.5rem] items-center justify-center rounded-full border-[3px] border-snap-orange/80 bg-white/15 backdrop-blur transition active:scale-90 disabled:opacity-40"
            >
              <span className="size-14 rounded-full bg-white shadow-sm transition" />
            </button>
            <button
              type="button"
              className="flex size-11 items-center justify-center rounded-full bg-white/12 text-white backdrop-blur transition hover:bg-white/20"
              onClick={flipCamera}
              title="Flip camera"
            >
              <SwitchCamera className="size-5" strokeWidth={1.5} />
            </button>
          </div>
        )}

        {preview && (
          <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-center gap-4 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-6 pt-20 pb-7">
            <Button
              variant="secondary"
              size="lg"
              className="h-12 rounded-full px-6"
              onClick={discardPreview}
              disabled={uploading}
            >
              <X className="size-5" /> Retake
            </Button>
            <Button
              size="lg"
              className="h-12 rounded-full bg-white px-6 text-black hover:bg-white/90"
              onClick={upload}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <Check className="size-5" />
              )}
              {uploading ? "Saving…" : "Keep it"}
            </Button>
          </div>
        )}

        {disabled && !preview && cameraState === "live" && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/75 px-8 text-center backdrop-blur-[2px]">
            <div>
              <Camera className="mx-auto size-7 text-white/70" strokeWidth={1.25} />
              <p className="mt-3 font-serif text-2xl italic text-white">
                Roll complete
              </p>
              <p className="mt-2 text-sm text-white/70">
                You&apos;ve used every shot — beautifully done.
              </p>
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}

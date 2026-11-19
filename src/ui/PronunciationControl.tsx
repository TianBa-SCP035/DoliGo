import { useId, useState } from "react";

export type AudioAttribution = {
  author?: string;
  licenseName: string;
  licenseUrl?: string;
  sourcePageUrl?: string;
};

export type PronunciationSource =
  | {
      kind: "recording";
      audioUrl: string;
      attribution: AudioAttribution;
    }
  | {
      kind: "synthesis-fallback";
      text: string;
      lang?: string;
    };

/**
 * Plays a caller-supplied public audio URL, or a labeled system-voice fallback.
 * Do not hard-code a dictionary or TTS vendor URL here.
 * Render nothing by omitting this component when no source is ready.
 */
export function PronunciationControl({
  source,
  speak,
}: {
  source?: PronunciationSource | null;
  speak?: (text: string, lang?: string) => void;
}) {
  const sourceId = useId();
  const [error, setError] = useState<string | null>(null);
  if (!source) return null;

  if (source.kind === "recording") {
    const { audioUrl, attribution } = source;
    return (
      <div className="doli-pronunciation-control">
        <audio
          controls
          preload="none"
          src={audioUrl}
          aria-label="单词录音"
          onError={() => setError("录音暂时无法播放。")}
        />
        {error && <p className="doli-muted">{error}</p>}
        <details>
          <summary>发音来源</summary>
          <p>
            {attribution.author ? `${attribution.author} · ` : ""}
            {attribution.licenseUrl ? (
              <a href={attribution.licenseUrl} target="_blank" rel="noreferrer">
                {attribution.licenseName}
              </a>
            ) : (
              attribution.licenseName
            )}
            {attribution.sourcePageUrl && (
              <>
                {" · "}
                <a
                  href={attribution.sourcePageUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  来源页
                </a>
              </>
            )}
          </p>
        </details>
      </div>
    );
  }

  const onSpeak = () => {
    setError(null);
    if (speak) {
      speak(source.text, source.lang);
      return;
    }
    const synth =
      typeof window !== "undefined" ? window.speechSynthesis : undefined;
    if (!synth || typeof SpeechSynthesisUtterance === "undefined") {
      setError("这台设备没有系统朗读。");
      return;
    }
    const utterance = new SpeechSynthesisUtterance(source.text);
    if (source.lang) utterance.lang = source.lang;
    synth.cancel();
    synth.speak(utterance);
  };

  return (
    <div className="doli-pronunciation-control">
      <button
        type="button"
        className="doli-text-button"
        onClick={onSpeak}
        aria-describedby={sourceId}
      >
        播放
      </button>
      <span id={sourceId} className="doli-synth-label">
        系统朗读（不是词典录音）
      </span>
      {error && <p className="doli-muted">{error}</p>}
    </div>
  );
}

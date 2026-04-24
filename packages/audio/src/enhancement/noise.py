"""
BRX SYSTEM - Audio Enhancement Module
Noise reduction, normalization, resampling
"""

import time
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import numpy as np
from src.core.logging import get_logger

logger = get_logger(__name__)


@dataclass
class EnhancementResult:
    output_path: str
    original_path: str
    sample_rate: int
    duration_seconds: float
    snr_db: float
    method: str
    processing_time_ms: float


class AudioEnhancer:
    def __init__(self):
        self.logger = get_logger("audio_enhancer")

    def reduce_noise(self, audio_path: str, output_path: str = None) -> EnhancementResult:
        start = time.time()

        try:
            import librosa
            import soundfile as sf
            from scipy.signal import wiener

            y, sr = librosa.load(audio_path, sr=None)

            # Estimate noise from first 0.5 seconds
            noise_sample = y[:int(sr * 0.5)]
            noise_power = np.mean(noise_sample ** 2)

            # Wiener filtering
            filtered = wiener(y, mysize=5)

            # Normalize
            filtered = filtered / np.max(np.abs(filtered)) * 0.95

            if not output_path:
                output_path = str(Path(audio_path).with_suffix(".enhanced.wav"))

            sf.write(output_path, filtered, sr)

            # Calculate SNR
            signal_power = np.mean(filtered ** 2)
            snr = 10 * np.log10(signal_power / (noise_power + 1e-10))

            processing_time = (time.time() - start) * 1000

            return EnhancementResult(
                output_path=output_path,
                original_path=audio_path,
                sample_rate=sr,
                duration_seconds=len(y) / sr,
                snr_db=float(snr),
                method="wiener_filter",
                processing_time_ms=processing_time,
            )
        except ImportError:
            raise RuntimeError("librosa/soundfile not installed")

    def normalize(self, audio_path: str, output_path: str = None, target_db: float = -20) -> EnhancementResult:
        start = time.time()

        try:
            import librosa
            import soundfile as sf

            y, sr = librosa.load(audio_path, sr=None)

            # RMS normalization
            rms = np.sqrt(np.mean(y ** 2))
            target_rms = 10 ** (target_db / 20)
            y_normalized = y * (target_rms / (rms + 1e-10))

            # Clip
            y_normalized = np.clip(y_normalized, -1.0, 1.0)

            if not output_path:
                output_path = str(Path(audio_path).with_suffix(".normalized.wav"))

            sf.write(output_path, y_normalized, sr)

            processing_time = (time.time() - start) * 1000

            return EnhancementResult(
                output_path=output_path,
                original_path=audio_path,
                sample_rate=sr,
                duration_seconds=len(y) / sr,
                snr_db=0.0,
                method="rms_normalization",
                processing_time_ms=processing_time,
            )
        except ImportError:
            raise RuntimeError("librosa/soundfile not installed")

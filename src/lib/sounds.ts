// Sound effects using Web Audio API
let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

export const playAlertSound = (type: 'critical' | 'high' | 'medium' | 'low' = 'critical') => {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Different frequencies for different severity levels
    const frequencies: Record<string, number[]> = {
      critical: [880, 440, 880, 440], // Urgent alternating
      high: [660, 550],
      medium: [440],
      low: [330]
    };
    
    const freq = frequencies[type] || frequencies.critical;
    const duration = type === 'critical' ? 0.15 : 0.2;
    
    oscillator.type = type === 'critical' ? 'square' : 'sine';
    
    let time = ctx.currentTime;
    freq.forEach((f, i) => {
      oscillator.frequency.setValueAtTime(f, time + i * duration);
    });
    
    // Envelope
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + duration * freq.length * 0.5);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration * freq.length);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration * freq.length);
  } catch (error) {
    console.log('Audio playback not supported');
  }
};

export const playAttackSound = () => {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(150, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.3);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.3);
    
    gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  } catch (error) {
    console.log('Audio playback not supported');
  }
};

export const playNotificationSound = () => {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
    oscillator.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
    
    gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  } catch (error) {
    console.log('Audio playback not supported');
  }
};
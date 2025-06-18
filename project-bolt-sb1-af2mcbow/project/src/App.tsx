import React, { useState, useCallback, useEffect } from 'react';
import { Copy, RefreshCw, Shield, Check, Eye, EyeOff, Settings, Zap } from 'lucide-react';

interface PasswordConfig {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeSimilar: boolean;
}

interface GeneratedPassword {
  password: string;
  strength: number;
  id: string;
}

const CHARSET = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  similar: 'il1Lo0O'
};

function App() {
  const [config, setConfig] = useState<PasswordConfig>({
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeSimilar: false
  });

  const [passwords, setPasswords] = useState<GeneratedPassword[]>([]);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const generateCharset = useCallback((config: PasswordConfig): string => {
    let charset = '';
    
    if (config.includeUppercase) charset += CHARSET.uppercase;
    if (config.includeLowercase) charset += CHARSET.lowercase;
    if (config.includeNumbers) charset += CHARSET.numbers;
    if (config.includeSymbols) charset += CHARSET.symbols;
    
    if (config.excludeSimilar) {
      charset = charset.split('').filter(char => !CHARSET.similar.includes(char)).join('');
    }
    
    return charset;
  }, []);

  const calculateStrength = useCallback((password: string): number => {
    let score = 0;
    
    // Length bonus
    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 15;
    if (password.length >= 16) score += 15;
    
    // Character variety
    if (/[a-z]/.test(password)) score += 10;
    if (/[A-Z]/.test(password)) score += 10;
    if (/[0-9]/.test(password)) score += 10;
    if (/[^a-zA-Z0-9]/.test(password)) score += 20;
    
    // Complexity patterns
    if (password.length >= 8 && /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9])/.test(password)) {
      score += 10;
    }
    
    return Math.min(100, score);
  }, []);

  const generatePassword = useCallback((config: PasswordConfig): string => {
    const charset = generateCharset(config);
    if (charset.length === 0) return '';
    
    let password = '';
    
    // Ensure at least one character from each selected category
    const guaranteedChars = [];
    if (config.includeUppercase) {
      const chars = config.excludeSimilar 
        ? CHARSET.uppercase.split('').filter(char => !CHARSET.similar.includes(char))
        : CHARSET.uppercase.split('');
      guaranteedChars.push(chars[Math.floor(Math.random() * chars.length)]);
    }
    if (config.includeLowercase) {
      const chars = config.excludeSimilar 
        ? CHARSET.lowercase.split('').filter(char => !CHARSET.similar.includes(char))
        : CHARSET.lowercase.split('');
      guaranteedChars.push(chars[Math.floor(Math.random() * chars.length)]);
    }
    if (config.includeNumbers) {
      const chars = config.excludeSimilar 
        ? CHARSET.numbers.split('').filter(char => !CHARSET.similar.includes(char))
        : CHARSET.numbers.split('');
      guaranteedChars.push(chars[Math.floor(Math.random() * chars.length)]);
    }
    if (config.includeSymbols) {
      guaranteedChars.push(CHARSET.symbols[Math.floor(Math.random() * CHARSET.symbols.length)]);
    }
    
    // Fill remaining positions
    for (let i = guaranteedChars.length; i < config.length; i++) {
      guaranteedChars.push(charset[Math.floor(Math.random() * charset.length)]);
    }
    
    // Shuffle the characters
    for (let i = guaranteedChars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [guaranteedChars[i], guaranteedChars[j]] = [guaranteedChars[j], guaranteedChars[i]];
    }
    
    return guaranteedChars.join('');
  }, [generateCharset]);

  const handleGenerate = useCallback(async () => {
    if (generateCharset(config).length === 0) return;
    
    setIsGenerating(true);
    
    // Simulate generation delay for better UX
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const newPasswords: GeneratedPassword[] = [];
    
    for (let i = 0; i < 3; i++) {
      const password = generatePassword(config);
      const strength = calculateStrength(password);
      const id = `${Date.now()}-${i}`;
      
      newPasswords.push({ password, strength, id });
    }
    
    setPasswords(newPasswords);
    setShowPasswords({});
    setCopiedId(null);
    setIsGenerating(false);
  }, [config, generateCharset, generatePassword, calculateStrength]);

  const copyToClipboard = useCallback(async (password: string, id: string) => {
    try {
      await navigator.clipboard.writeText(password);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy password:', err);
    }
  }, []);

  const togglePasswordVisibility = useCallback((id: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  }, []);

  const getStrengthColor = (strength: number) => {
    if (strength >= 80) return 'text-green-600';
    if (strength >= 60) return 'text-yellow-600';
    if (strength >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getStrengthBg = (strength: number) => {
    if (strength >= 80) return 'bg-green-500';
    if (strength >= 60) return 'bg-yellow-500';
    if (strength >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getStrengthText = (strength: number) => {
    if (strength >= 80) return 'Very Strong';
    if (strength >= 60) return 'Strong';
    if (strength >= 40) return 'Medium';
    return 'Weak';
  };

  const isConfigValid = generateCharset(config).length > 0;

  // Generate initial passwords
  useEffect(() => {
    handleGenerate();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-3 rounded-2xl shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Password Generator
          </h1>
          <p className="text-gray-600 text-lg">
            Create secure, customizable passwords with advanced options
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Settings
                </h2>
              </div>

              <div className="space-y-6">
                {/* Length Control */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Password Length: {config.length}
                  </label>
                  <input
                    type="range"
                    min="4"
                    max="50"
                    value={config.length}
                    onChange={(e) => setConfig(prev => ({ ...prev, length: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>4</span>
                    <span>50</span>
                  </div>
                </div>

                {/* Character Options */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">Character Types</label>
                  
                  {[
                    { key: 'includeUppercase', label: 'Uppercase (A-Z)', example: 'ABC' },
                    { key: 'includeLowercase', label: 'Lowercase (a-z)', example: 'abc' },
                    { key: 'includeNumbers', label: 'Numbers (0-9)', example: '123' },
                    { key: 'includeSymbols', label: 'Symbols (!@#)', example: '!@#' }
                  ].map(({ key, label, example }) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id={key}
                          checked={config[key as keyof PasswordConfig] as boolean}
                          onChange={(e) => setConfig(prev => ({ ...prev, [key]: e.target.checked }))}
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor={key} className="text-sm text-gray-700 cursor-pointer">
                          {label}
                        </label>
                      </div>
                      <span className="text-xs text-gray-500 font-mono">{example}</span>
                    </div>
                  ))}
                </div>

                {/* Exclude Similar Characters */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="excludeSimilar"
                      checked={config.excludeSimilar}
                      onChange={(e) => setConfig(prev => ({ ...prev, excludeSimilar: e.target.checked }))}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <label htmlFor="excludeSimilar" className="text-sm text-gray-700 cursor-pointer">
                      Exclude Similar Characters
                    </label>
                  </div>
                  <span className="text-xs text-gray-500 font-mono">il1Lo0O</span>
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerate}
                  disabled={!isConfigValid || isGenerating}
                  className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${
                    isConfigValid && !isGenerating
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                      : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  {isGenerating ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Zap className="w-5 h-5" />
                  )}
                  {isGenerating ? 'Generating...' : 'Generate Passwords'}
                </button>

                {!isConfigValid && (
                  <p className="text-sm text-red-600 text-center">
                    Please select at least one character type
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Generated Passwords */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Generated Passwords
              </h2>

              <div className="space-y-4">
                {passwords.map((item, index) => (
                  <div
                    key={item.id}
                    className="group bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-600">
                          Password {index + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full transition-all duration-500 ${getStrengthBg(item.strength)}`}
                              style={{ width: `${item.strength}%` }}
                            ></div>
                          </div>
                          <span className={`text-xs font-medium ${getStrengthColor(item.strength)}`}>
                            {getStrengthText(item.strength)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => togglePasswordVisibility(item.id)}
                          className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                          title={showPasswords[item.id] ? 'Hide password' : 'Show password'}
                        >
                          {showPasswords[item.id] ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => copyToClipboard(item.password, item.id)}
                          className="p-1 text-gray-500 hover:text-indigo-600 transition-colors"
                          title="Copy to clipboard"
                        >
                          {copiedId === item.id ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-3 font-mono text-sm border">
                      {showPasswords[item.id] ? (
                        <span className="text-gray-900 break-all">{item.password}</span>
                      ) : (
                        <span className="text-gray-400 select-none">
                          {'•'.repeat(item.password.length)}
                        </span>
                      )}
                    </div>
                    
                    {copiedId === item.id && (
                      <div className="mt-2 text-sm text-green-600 flex items-center gap-1">
                        <Check className="w-4 h-4" />
                        Copied to clipboard!
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {passwords.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Shield className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>Click "Generate Passwords" to create secure passwords</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>
            🔒 All passwords are generated locally in your browser. Nothing is sent to any server.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
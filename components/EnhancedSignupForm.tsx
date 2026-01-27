'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, User, Mail, Lock, Phone, MapPin, Briefcase, Calendar, DollarSign, CheckCircle2 } from 'lucide-react';

interface SignupFormData {
  // Basic Info
  fullName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
  nationality: string;

  // Address
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;

  // Employment
  occupation: string;
  employer: string;
  annualIncome: string;

  // Files
  profilePhoto: File | null;
}

export default function EnhancedSignupForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'error' | 'info'>('error');
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [accountNumber, setAccountNumber] = useState('');
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState<SignupFormData>({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: '',
    nationality: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    occupation: '',
    employer: '',
    annualIncome: '',
    profilePhoto: null,
  });

  const handleInputChange = (field: keyof SignupFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (file: File | null) => {
    setFormData(prev => ({ ...prev, profilePhoto: file }));

    // Create preview URL
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setProfilePhotoPreview(previewUrl);
    } else {
      setProfilePhotoPreview(null);
    }
  };

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // Set max dimensions
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;

          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx?.drawImage(img, 0, 0, width, height);

          // Convert to blob with compression
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                reject(new Error('Image compression failed'));
              }
            },
            'image/jpeg',
            0.7 // 70% quality
          );
        };
        img.onerror = () => reject(new Error('Failed to load image'));
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
    });
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setMessage('Password must be at least 8 characters');
      return;
    }

    setMessage('');
    setStep(2);
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setStep(3);
  };

  const handleStep3Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setStep(4);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Validate files
      if (!formData.profilePhoto) {
        setMessageType('error');
        setMessage('Please upload a profile photo');
        setLoading(false);
        return;
      }

      // Compress image first
      setMessageType('info');
      setMessage('Compressing image...');
      const compressedPhoto = await compressImage(formData.profilePhoto);

      // Convert compressed photo to base64
      setMessageType('info');
      setMessage('Uploading...');
      const profilePhotoBase64 = await convertToBase64(compressedPhoto);

      // Submit registration
      const response = await fetch('/api/auth/signup-enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          profilePhoto: profilePhotoBase64,
        }),
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // Response is not JSON, likely an error from the server
        const text = await response.text();
        throw new Error(text || 'Server error: Invalid response format');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Set account details and show welcome modal directly
      setAccountNumber(data.accountNumber);
      setTwoFactorToken(data.twoFactorToken);
      setShowWelcomeModal(true);
      setMessage('');
      setLoading(false);
    } catch (error: any) {
      setMessageType('error');
      setMessage(error.message || 'Registration failed');
      setLoading(false);
    }
  };


  const handleWelcomeClose = () => {
    // Clear chatbot localStorage for fresh start
    localStorage.removeItem('chatbot_messages');
    localStorage.removeItem('chatbot_guest_name');
    localStorage.removeItem('chatbot_guest_id');
    localStorage.removeItem('chatbot_sent_ids');

    setShowWelcomeModal(false);
    router.push('/login');
  };

  const handleContinueToDashboard = async () => {
    setLoading(true);
    try {
      // Log the user in automatically with their credentials
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          twoFactorToken: twoFactorToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to login');
      }

      // Clear chatbot localStorage for fresh start
      localStorage.removeItem('chatbot_messages');
      localStorage.removeItem('chatbot_guest_name');
      localStorage.removeItem('chatbot_guest_id');
      localStorage.removeItem('chatbot_sent_ids');

      // Redirect to dashboard
      router.push('/dashboard');
      router.refresh();
    } catch (error: any) {
      setMessage(error.message || 'Failed to login automatically');
      // Fall back to manual login
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Personal Information
  if (step === 1) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Your Account</h2>
          <p className="text-gray-600">Step 1 of 4: Personal Information</p>
          <div className="mt-4 flex gap-2">
            <div className="flex-1 h-2 bg-blue-600 rounded"></div>
            <div className="flex-1 h-2 bg-gray-200 rounded"></div>
            <div className="flex-1 h-2 bg-gray-200 rounded"></div>
            <div className="flex-1 h-2 bg-gray-200 rounded"></div>
          </div>
        </div>

        <form onSubmit={handleStep1Submit} className="space-y-6">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Full Legal Name *
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="John Doe"
            />
          </div>

          {/* Username and Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username *
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="johndoe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="john@example.com"
              />
            </div>
          </div>

          {/* Password */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Lock className="w-4 h-4 inline mr-2" />
                Password *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Minimum 8 characters"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password *
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Re-enter password"
              />
            </div>
          </div>

          {/* Phone and DOB */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                Phone Number *
              </label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+1 234 567 8900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Date of Birth *
              </label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Gender and Nationality */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender *
              </label>
              <select
                value={formData.gender}
                onChange={(e) => handleInputChange('gender', e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nationality *
              </label>
              <input
                type="text"
                value={formData.nationality}
                onChange={(e) => handleInputChange('nationality', e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="United States"
              />
            </div>
          </div>

          {message && (
            <div className={`p-4 rounded-lg ${messageType === 'error' ? 'bg-red-50 text-red-800' : 'bg-blue-50 text-blue-800'}`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
          >
            Continue to Address Information
          </button>
        </form>
      </div>
    );
  }

  // Step 2: Address Information
  if (step === 2) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Address Information</h2>
          <p className="text-gray-600">Step 2 of 4: Where do you live?</p>
          <div className="mt-4 flex gap-2">
            <div className="flex-1 h-2 bg-blue-600 rounded"></div>
            <div className="flex-1 h-2 bg-blue-600 rounded"></div>
            <div className="flex-1 h-2 bg-gray-200 rounded"></div>
            <div className="flex-1 h-2 bg-gray-200 rounded"></div>
          </div>
        </div>

        <form onSubmit={handleStep2Submit} className="space-y-6">
          {/* Full Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-2" />
              Street Address *
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              required
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="123 Main Street, Apt 4B"
            />
          </div>

          {/* City and State */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City *
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="New York"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State/Province *
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="New York"
              />
            </div>
          </div>

          {/* Postal Code and Country */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Postal/ZIP Code *
              </label>
              <input
                type="text"
                value={formData.postalCode}
                onChange={(e) => handleInputChange('postalCode', e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="10001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country *
              </label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="United States"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg transition duration-200"
            >
              Back
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
            >
              Continue to Employment
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Step 3: Employment Information
  if (step === 3) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Employment Information</h2>
          <p className="text-gray-600">Step 3 of 4: Your work details</p>
          <div className="mt-4 flex gap-2">
            <div className="flex-1 h-2 bg-blue-600 rounded"></div>
            <div className="flex-1 h-2 bg-blue-600 rounded"></div>
            <div className="flex-1 h-2 bg-blue-600 rounded"></div>
            <div className="flex-1 h-2 bg-gray-200 rounded"></div>
          </div>
        </div>

        <form onSubmit={handleStep3Submit} className="space-y-6">
          {/* Occupation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Briefcase className="w-4 h-4 inline mr-2" />
              Occupation *
            </label>
            <input
              type="text"
              value={formData.occupation}
              onChange={(e) => handleInputChange('occupation', e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Software Engineer"
            />
          </div>

          {/* Employer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employer/Company Name *
            </label>
            <input
              type="text"
              value={formData.employer}
              onChange={(e) => handleInputChange('employer', e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="ABC Corporation"
            />
          </div>

          {/* Annual Income */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="w-4 h-4 inline mr-2" />
              Annual Income Range *
            </label>
            <select
              value={formData.annualIncome}
              onChange={(e) => handleInputChange('annualIncome', e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">Select Income Range</option>
              <option value="Under $25,000">Under $25,000</option>
              <option value="$25,000 - $50,000">$25,000 - $50,000</option>
              <option value="$50,000 - $75,000">$50,000 - $75,000</option>
              <option value="$75,000 - $100,000">$75,000 - $100,000</option>
              <option value="$100,000 - $150,000">$100,000 - $150,000</option>
              <option value="$150,000 - $250,000">$150,000 - $250,000</option>
              <option value="Over $250,000">Over $250,000</option>
            </select>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg transition duration-200"
            >
              Back
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
            >
              Continue to Verification
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Step 4: Profile Photo Upload
  return (
    <>
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Profile Photo</h2>
          <p className="text-gray-600">Step 4 of 4: Upload your profile picture</p>
          <div className="mt-4 flex gap-2">
            <div className="flex-1 h-2 bg-blue-600 rounded"></div>
            <div className="flex-1 h-2 bg-blue-600 rounded"></div>
            <div className="flex-1 h-2 bg-blue-600 rounded"></div>
            <div className="flex-1 h-2 bg-blue-600 rounded"></div>
          </div>
        </div>

        <form onSubmit={handleFinalSubmit} className="space-y-6">
          {/* Profile Photo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Upload className="w-4 h-4 inline mr-2" />
              Profile Photo *
            </label>
            <div className="flex items-center gap-6">
              {/* Circular Preview */}
              <div className="flex-shrink-0">
                {profilePhotoPreview ? (
                  <div className="relative">
                    <img
                      src={profilePhotoPreview}
                      alt="Profile preview"
                      className="w-32 h-32 rounded-full object-cover border-4 border-blue-500 shadow-lg"
                    />
                    <div className="absolute -bottom-2 -right-2 bg-green-500 text-white rounded-full p-2">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-100 border-4 border-dashed border-gray-300 flex items-center justify-center">
                    <User className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Upload Area */}
              <div className="flex-1 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                  className="hidden"
                  id="profilePhoto"
                  required
                />
                <label htmlFor="profilePhoto" className="cursor-pointer">
                  {formData.profilePhoto ? (
                    <div className="text-green-600">
                      <CheckCircle2 className="w-8 h-8 mx-auto mb-2" />
                      <p className="font-medium">{formData.profilePhoto.name}</p>
                      <p className="text-sm text-gray-500 mt-1">Click to change photo</p>
                    </div>
                  ) : (
                    <div className="text-gray-500">
                      <Upload className="w-8 h-8 mx-auto mb-2" />
                      <p className="font-medium">Click to upload profile photo</p>
                      <p className="text-sm mt-1">PNG, JPG up to 5MB</p>
                      <p className="text-xs text-gray-400 mt-2">This will be shown on your dashboard</p>
                    </div>
                  )}
                </label>
              </div>
            </div>
          </div>

          {message && (
            <div className={`p-4 rounded-lg ${messageType === 'error' ? 'bg-red-50 text-red-800' : 'bg-blue-50 text-blue-800'}`}>
              {message}
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setStep(3)}
              disabled={loading}
              className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-800 font-semibold py-3 px-4 rounded-lg transition duration-200"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
            >
              {loading ? 'Submitting...' : 'Complete Registration'}
            </button>
          </div>
        </form>
      </div>

      {/* Welcome Modal */}
      {showWelcomeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 text-center my-8 max-h-[90vh] overflow-y-auto">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-green-600" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">Welcome to Sterling Capital Bank!</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
              Your account has been successfully created and is now pending admin verification.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6 mb-3 sm:mb-4">
              <p className="text-xs sm:text-sm text-gray-600 mb-2">Your Account Number</p>
              <p className="text-2xl sm:text-3xl font-bold text-blue-600 tracking-wider break-all">{accountNumber}</p>
            </div>

            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 sm:p-6 mb-3 sm:mb-4">
              <p className="text-xs sm:text-sm font-semibold text-yellow-900 mb-2">Your 2FA Token (Login Required)</p>
              <p className="text-2xl sm:text-3xl font-mono font-bold text-yellow-900 tracking-widest mb-3 break-all">{twoFactorToken}</p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(twoFactorToken);
                  alert('2FA token copied to clipboard!');
                }}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 text-xs sm:text-sm"
              >
                Copy 2FA Token
              </button>
              <p className="text-xs text-yellow-800 font-semibold mt-3">
                ⚠️ IMPORTANT: Save this token securely! You will need it every time you log in.
              </p>
            </div>

            <div className="text-left bg-gray-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 space-y-2 text-xs sm:text-sm">
              <p className="flex items-start">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                <span>Documents submitted for verification</span>
              </p>
              <p className="flex items-start">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                <span>Email verified successfully</span>
              </p>
              <p className="flex items-start">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                <span>Account ready for activation</span>
              </p>
            </div>

            <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">
              You can now access your account dashboard or log in later. Admin will verify your documents within 24-48 hours.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleContinueToDashboard}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {loading ? 'Loading...' : 'Continue to Dashboard'}
              </button>
              <button
                onClick={handleWelcomeClose}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 rounded-lg transition duration-200 text-sm sm:text-base"
              >
                Go to Login Page
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

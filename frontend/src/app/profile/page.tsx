'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Profile() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'details' | 'password'>('details');
  const [isEditing, setIsEditing] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for user details
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
  });

  // Form state for password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  // Profile image state
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    // Redirect if not logged in
    if (!loading && !user) {
      router.push('/login');
    }

    // Populate form with user data when available
    if (user) {
      setFormData({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        email: user.email || '',
        phoneNumber: user.phone_number || '',
      });

      if (user.profileImage) {
        setProfileImage(user.profileImage);
      }
    }
  }, [user, loading, router]);

  const handleDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone_number: formData.phoneNumber || undefined,
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update profile');
      }

      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating your profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Password validation
    if (passwordData.newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      setError('New passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/users/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          current_password: passwordData.currentPassword,
          new_password: passwordData.newPassword,
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to change password');
      }

      setSuccess('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
    } catch (err: any) {
      setError(err.message || 'An error occurred while changing your password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setProfileImage(URL.createObjectURL(file));
    }
  };

  const handleImageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) return;
    
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('profileImage', imageFile);

    try {
      const response = await fetch('/api/users/profile-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: formData
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to upload image');
      }

      setSuccess('Profile image updated successfully!');
      setImageFile(null);
    } catch (err: any) {
      setError(err.message || 'An error occurred while uploading your image');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            </div>

            {/* Notification messages */}
            {success && (
            <div className="mx-6 mt-4 p-3 bg-green-100 text-green-800 rounded-md">
                {success}
            </div>
            )}
            
            {error && (
            <div className="mx-6 mt-4 p-3 bg-red-100 text-red-800 rounded-md">
                {error}
            </div>
            )}

            <div className="p-6">
            {/* Profile Picture Section */}
            <div className="mb-8 flex flex-col items-center">
                <div className="w-32 h-32 relative rounded-full overflow-hidden border-4 border-gray-200 mb-4">
                {profileImage ? (
                    <Image 
                    src={profileImage}
                    alt={`${formData.firstName}'s profile`}
                    fill
                    className="object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                    <span className="text-4xl font-bold text-gray-500">
                        {formData.firstName.charAt(0)}{formData.lastName.charAt(0)}
                    </span>
                    </div>
                )}
                </div>
                
                <form onSubmit={handleImageSubmit} className="flex flex-col items-center">
                <label htmlFor="profile-image" className="cursor-pointer mb-2 text-sm font-medium text-blue-600 hover:text-blue-500">
                    {profileImage ? 'Change profile picture' : 'Upload profile picture'}
                </label>
                <input
                    id="profile-image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                />
                
                {imageFile && (
                    <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-2 px-4 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-500 disabled:bg-blue-300"
                    >
                    {isSubmitting ? 'Uploading...' : 'Save Picture'}
                    </button>
                )}
                </form>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="flex -mb-px">
                <button 
                    onClick={() => setActiveTab('details')}
                    className={`mr-8 py-2 border-b-2 ${
                    activeTab === 'details' 
                        ? 'border-blue-500 text-blue-600' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                    Personal Details
                </button>
                <button 
                    onClick={() => setActiveTab('password')}
                    className={`py-2 border-b-2 ${
                    activeTab === 'password' 
                        ? 'border-blue-500 text-blue-600' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                    Change Password
                </button>
                </nav>
            </div>

            {/* Profile Details Tab */}
            {activeTab === 'details' && (
                <div>
                <form onSubmit={handleDetailsSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                        </label>
                        <input
                        id="firstName"
                        name="firstName"
                        type="text"
                        required
                        readOnly={!isEditing}
                        value={formData.firstName}
                        onChange={handleDetailsChange}
                        className={`block w-full rounded-md border-0 p-2.5 text-gray-900 ring-1 ring-inset ${
                            isEditing 
                            ? 'ring-gray-300 focus:ring-2 focus:ring-blue-600'
                            : 'bg-gray-50 ring-gray-200'
                        }`}
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name
                        </label>
                        <input
                        id="lastName"
                        name="lastName"
                        type="text"
                        required
                        readOnly={!isEditing}
                        value={formData.lastName}
                        onChange={handleDetailsChange}
                        className={`block w-full rounded-md border-0 p-2.5 text-gray-900 ring-1 ring-inset ${
                            isEditing 
                            ? 'ring-gray-300 focus:ring-2 focus:ring-blue-600'
                            : 'bg-gray-50 ring-gray-200'
                        }`}
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                        </label>
                        <input
                        id="email"
                        name="email"
                        type="email"
                        readOnly
                        value={formData.email}
                        className="block w-full rounded-md border-0 p-2.5 text-gray-900 bg-gray-50 ring-1 ring-inset ring-gray-200"
                        />
                        <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                    </div>
                    
                    <div>
                        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                        </label>
                        <input
                        id="phoneNumber"
                        name="phoneNumber"
                        type="tel"
                        readOnly={!isEditing}
                        value={formData.phoneNumber}
                        onChange={handleDetailsChange}
                        className={`block w-full rounded-md border-0 p-2.5 text-gray-900 ring-1 ring-inset ${
                            isEditing 
                            ? 'ring-gray-300 focus:ring-2 focus:ring-blue-600'
                            : 'bg-gray-50 ring-gray-200'
                        }`}
                        />
                    </div>
                    </div>
                    
                    {!isEditing ? (
                    <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500"
                    >
                        Edit Profile
                    </button>
                    ) : (
                    <div className="flex space-x-4">
                        <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 disabled:bg-blue-300"
                        >
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                        type="button"
                        onClick={() => {
                            setIsEditing(false);
                            // Reset form to original user data
                            if (user) {
                            setFormData({
                                firstName: user.first_name || '',
                                lastName: user.last_name || '',
                                email: user.email || '',
                                phoneNumber: user.phone_number || '',
                            });
                            }
                        }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                        >
                        Cancel
                        </button>
                    </div>
                    )}
                </form>
                </div>
            )}

            {/* Change Password Tab */}
            {activeTab === 'password' && (
                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                    </label>
                    <input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    required
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className="block w-full rounded-md border-0 p-2.5 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-600"
                    />
                </div>
                
                <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                    </label>
                    <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    required
                    minLength={8}
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className="block w-full rounded-md border-0 p-2.5 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-600"
                    />
                    <p className="mt-1 text-xs text-gray-500">Password must be at least 8 characters</p>
                </div>
                
                <div>
                    <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                    </label>
                    <input
                    id="confirmNewPassword"
                    name="confirmNewPassword"
                    type="password"
                    required
                    value={passwordData.confirmNewPassword}
                    onChange={handlePasswordChange}
                    className="block w-full rounded-md border-0 p-2.5 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-600"
                    />
                </div>
                
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 disabled:bg-blue-300"
                >
                    {isSubmitting ? 'Changing Password...' : 'Change Password'}
                </button>
                </form>
            )}
            </div>
        </div>
        </div>
    </ProtectedRoute>
  );
}
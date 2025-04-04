'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Navbar from '@/components/navbar';

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
    formData.append('image', imageFile);

    try {
      const response = await fetch('/api/users/profile/image', {
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
      <div className="flex min-h-screen items-center justify-center bg-base-200">
        <div className="text-xl text-base-content">Loading...</div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <Navbar />
      <div className="min-h-screen bg-base-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto bg-base-100 rounded-lg shadow-md">
          <div className="p-6 border-b border-base-300">
            <h1 className="text-2xl font-bold text-base-content">My Profile</h1>
          </div>
  
          {/* Notification messages */}
          {success && (
            <div className="mx-6 mt-4 p-3 bg-success/20 text-success-content rounded-md">
              {success}
            </div>
          )}
          
          {error && (
            <div className="mx-6 mt-4 p-3 bg-error/20 text-error-content rounded-md">
              {error}
            </div>
          )}

          <div className="p-6">
            {/* Profile Picture Section */}
            <div className="mb-8 flex flex-col items-center">
              <div className="w-32 h-32 relative rounded-full overflow-hidden border-4 border-base-300 mb-4">
                {profileImage ? (
                  <Image 
                    src={profileImage}
                    alt={`${formData.firstName}'s profile`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-base-300 flex items-center justify-center">
                    <span className="text-4xl font-bold text-base-content/70">
                      {formData.firstName.charAt(0)}{formData.lastName.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              
              <form onSubmit={handleImageSubmit} className="flex flex-col items-center">
                <label htmlFor="profile-image" className="cursor-pointer mb-2 text-sm font-medium text-primary hover:text-primary-focus">
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
                    className="mt-2 px-4 py-1 bg-primary text-primary-content text-sm rounded-md hover:bg-primary-focus disabled:bg-primary/50"
                  >
                    {isSubmitting ? 'Uploading...' : 'Save Picture'}
                  </button>
                )}
              </form>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-base-300 mb-6">
              <nav className="flex -mb-px">
                <button 
                  onClick={() => setActiveTab('details')}
                  className={`mr-8 py-2 border-b-2 ${
                    activeTab === 'details' 
                      ? 'border-primary text-primary' 
                      : 'border-transparent text-base-content/70 hover:text-base-content hover:border-base-300'
                  }`}
                >
                  Personal Details
                </button>
                <button 
                  onClick={() => setActiveTab('password')}
                  className={`py-2 border-b-2 ${
                    activeTab === 'password' 
                      ? 'border-primary text-primary' 
                      : 'border-transparent text-base-content/70 hover:text-base-content hover:border-base-300'
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
                      <label htmlFor="firstName" className="block text-sm font-medium text-base-content mb-1">
                        First Name
                      </label>
                      <input
                        id="firstName"
                        name="firstName"
                        type="text"
                        value={formData.firstName}
                        onChange={handleDetailsChange}
                        disabled={!isEditing}
                        className="block w-full p-2 border border-base-300 rounded-md bg-base-100 text-base-content disabled:bg-base-200"
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-base-content mb-1">
                        Last Name
                      </label>
                      <input
                        id="lastName"
                        name="lastName"
                        type="text"
                        value={formData.lastName}
                        onChange={handleDetailsChange}
                        disabled={!isEditing}
                        className="block w-full p-2 border border-base-300 rounded-md bg-base-100 text-base-content disabled:bg-base-200"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-base-content mb-1">
                        Email
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        disabled={true}
                        className="block w-full p-2 border border-base-300 rounded-md bg-base-200 text-base-content/70"
                      />
                      <p className="text-xs text-base-content/60 mt-1">Email cannot be changed</p>
                    </div>
                    <div>
                      <label htmlFor="phoneNumber" className="block text-sm font-medium text-base-content mb-1">
                        Phone Number
                      </label>
                      <input
                        id="phoneNumber"
                        name="phoneNumber"
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={handleDetailsChange}
                        disabled={!isEditing}
                        className="block w-full p-2 border border-base-300 rounded-md bg-base-100 text-base-content disabled:bg-base-200"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-4">
                    {!isEditing ? (
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 bg-primary text-primary-content rounded-md hover:bg-primary-focus focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        Edit Profile
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="px-4 py-2 border border-base-300 text-base-content rounded-md hover:bg-base-200"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="px-4 py-2 bg-primary text-primary-content rounded-md hover:bg-primary-focus focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-primary/50"
                        >
                          {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </button>
                      </>
                    )}
                  </div>
                </form>
              </div>
            )}

            {/* Change Password Tab */}
            {activeTab === 'password' && (
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-base-content mb-1">
                    Current Password
                  </label>
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                    className="block w-full p-2 border border-base-300 rounded-md bg-base-100 text-base-content"
                  />
                </div>
                
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-base-content mb-1">
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                    minLength={8}
                    className="block w-full p-2 border border-base-300 rounded-md bg-base-100 text-base-content"
                  />
                  <p className="text-xs text-base-content/60 mt-1">Password must be at least 8 characters long</p>
                </div>
                
                <div>
                  <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-base-content mb-1">
                    Confirm New Password
                  </label>
                  <input
                    id="confirmNewPassword"
                    name="confirmNewPassword"
                    type="password"
                    value={passwordData.confirmNewPassword}
                    onChange={handlePasswordChange}
                    required
                    className="block w-full p-2 border border-base-300 rounded-md bg-base-100 text-base-content"
                  />
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-primary text-primary-content rounded-md hover:bg-primary-focus focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-primary/50"
                  >
                    {isSubmitting ? 'Changing Password...' : 'Change Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
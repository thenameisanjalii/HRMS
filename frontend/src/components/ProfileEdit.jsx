import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Camera, Save, Upload, FileText, Trash2, Download, Lock, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usersAPI, getPhotoUrl } from '../services/api';
import './ProfileEdit.css';

const ProfileEdit = ({ onBack }) => {
    const { user, login } = useAuth();
    const fileInputRef = useRef(null);
    const photoInputRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        gender: '',
        dateOfBirth: '',
        address: {
            street: '',
            city: '',
            state: '',
            pincode: ''
        }
    });
    const [documents, setDocuments] = useState([]);
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showPasswordDialog, setShowPasswordDialog] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [changingPassword, setChangingPassword] = useState(false);

    // Fetch user profile data on mount
    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                setLoading(true);
                const result = await usersAPI.getById(user._id || user.id);
                if (result.success && result.user) {
                    const userData = result.user;
                    setFormData({
                        firstName: userData.profile?.firstName || '',
                        lastName: userData.profile?.lastName || '',
                        phone: userData.profile?.phone || '',
                        gender: userData.profile?.gender || '',
                        dateOfBirth: userData.profile?.dateOfBirth 
                            ? new Date(userData.profile.dateOfBirth).toISOString().split('T')[0] 
                            : '',
                        address: {
                            street: userData.profile?.address?.street || '',
                            city: userData.profile?.address?.city || '',
                            state: userData.profile?.address?.state || '',
                            pincode: userData.profile?.address?.pincode || ''
                        }
                    });
                    
                    if (userData.profile?.photo) {
                        setProfilePhoto(userData.profile.photo);
                        setPhotoPreview(getPhotoUrl(userData.profile.photo));
                    }
                    
                    // Load documents if any
                    if (userData.documents?.other) {
                        setDocuments(userData.documents.other);
                    }
                }
            } catch (error) {
                console.error('Error fetching user profile:', error);
                alert('Failed to load profile data');
            } finally {
                setLoading(false);
            }
        };

        if (user?._id || user?.id) {
            fetchUserProfile();
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // Handle nested address fields
        if (name.startsWith('address.')) {
            const addressField = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                address: {
                    ...prev.address,
                    [addressField]: value
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        const newDocs = files.map(file => ({
            id: Date.now() + Math.random(),
            name: file.name,
            size: (file.size / 1024).toFixed(2) + ' KB',
            type: file.type,
            uploadedAt: new Date().toLocaleDateString('en-IN')
        }));
        setDocuments(prev => [...prev, ...newDocs]);
    };

    const handleDeleteDoc = (id) => {
        setDocuments(prev => prev.filter(doc => doc.id !== id));
    };

    const handlePhotoChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size should be less than 5MB');
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPhotoPreview(reader.result);
        };
        reader.readAsDataURL(file);

        // Upload to server
        setUploading(true);
        try {
            const result = await usersAPI.uploadProfilePhoto(user._id || user.id, file);
            if (result.success) {
                setProfilePhoto(result.photoPath);
                alert('Profile photo uploaded successfully!');
                // Update user in context
                login({ 
                    ...user, 
                    profile: { 
                        ...user.profile, 
                        photo: result.photoPath 
                    } 
                });
            } else {
                alert('Failed to upload photo: ' + result.message);
            }
        } catch (error) {
            console.error('Error uploading photo:', error);
            alert('Error uploading photo. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        
        try {
            // Prepare profile data according to database schema
            const profileData = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                phone: formData.phone,
                gender: formData.gender,
                dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth) : null,
                address: {
                    street: formData.address.street,
                    city: formData.address.city,
                    state: formData.address.state,
                    pincode: formData.address.pincode
                }
            };

            const result = await usersAPI.updateMyProfile(profileData);
            
            if (result.success) {
                alert('Profile updated successfully!');
                // Update user in context with the new data
                login(result.user);
                onBack();
            } else {
                alert('Failed to update profile: ' + (result.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Error updating profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="profile-edit-container">
                <div className="loading-message">Loading profile data...</div>
            </div>
        );
    }

    return (
        <div className="profile-edit-container">
            <div className="profile-edit-header">
                <button className="back-btn" onClick={onBack}>
                    <ArrowLeft size={20} />
                    <span>Back to Dashboard</span>
                </button>
                <h2>Edit Profile</h2>
            </div>

            <div className="profile-edit-content">
                <div className="profile-avatar-section">
                    <div className="profile-avatar-large">
                        {photoPreview ? (
                            <img 
                                src={photoPreview} 
                                alt="Profile" 
                                style={{ 
                                    width: '100%',
                                    height: '100%', 
                                    objectFit: 'cover',
                                    borderRadius: '50%'
                                }} 
                            />
                        ) : (
                            <span style={{ fontSize: '3rem', fontWeight: 'bold' }}>
                                {formData.firstName?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
                            </span>
                        )}
                    </div>
                    <button 
                        type="button"
                        className="change-avatar-btn" 
                        onClick={() => photoInputRef.current.click()}
                        disabled={uploading}
                    >
                        <Camera size={16} />
                        <span>{uploading ? 'Uploading...' : 'Change Photo'}</span>
                    </button>
                    <input
                        type="file"
                        ref={photoInputRef}
                        onChange={handlePhotoChange}
                        accept="image/*"
                        style={{ display: 'none' }}
                    />
                </div>

                <form onSubmit={handleSubmit} className="profile-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label>First Name</label>
                            <input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Last Name</label>
                            <input
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Username</label>
                            <input
                                type="text"
                                value={user?.username || ''}
                                readOnly
                                disabled
                                style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                            />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                value={user?.email || ''}
                                readOnly
                                disabled
                                style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Phone</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="+91 98765 43210"
                            />
                        </div>
                        <div className="form-group">
                            <label>Date of Birth</label>
                            <input
                                type="date"
                                name="dateOfBirth"
                                value={formData.dateOfBirth}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Gender</label>
                            <select
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                            >
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Designation</label>
                            <input
                                type="text"
                                value={user?.employment?.designation || user?.role || ''}
                                readOnly
                                disabled
                                style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Street Address</label>
                            <input
                                type="text"
                                name="address.street"
                                value={formData.address.street}
                                onChange={handleChange}
                                placeholder="Street address"
                            />
                        </div>
                        <div className="form-group">
                            <label>City</label>
                            <input
                                type="text"
                                name="address.city"
                                value={formData.address.city}
                                onChange={handleChange}
                                placeholder="City"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>State</label>
                            <input
                                type="text"
                                name="address.state"
                                value={formData.address.state}
                                onChange={handleChange}
                                placeholder="State"
                            />
                        </div>
                        <div className="form-group">
                            <label>Pincode</label>
                            <input
                                type="text"
                                name="address.pincode"
                                value={formData.address.pincode}
                                onChange={handleChange}
                                placeholder="Pincode"
                                maxLength="6"
                            />
                        </div>
                    </div>

                    <div className="password-section">
                        <h3>Security</h3>
                        <button 
                            type="button" 
                            className="change-password-btn"
                            onClick={() => setShowPasswordDialog(true)}
                        >
                            <Lock size={18} />
                            <span>Change Password</span>
                        </button>
                    </div>

                    <div className="documents-section">
                        <div className="documents-header">
                            <h3>My Documents</h3>
                            <button type="button" className="upload-btn" onClick={() => fileInputRef.current.click()}>
                                <Upload size={16} />
                                <span>Upload Document</span>
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                multiple
                                style={{ display: 'none' }}
                            />
                        </div>
                        <div className="documents-list">
                            {documents.length === 0 ? (
                                <div className="no-documents">
                                    <FileText size={40} />
                                    <p>No documents uploaded yet</p>
                                    <span>Upload your documents like ID proof, certificates, etc.</span>
                                </div>
                            ) : (
                                documents.map(doc => (
                                    <div key={doc.id} className="document-item">
                                        <FileText size={20} />
                                        <div className="doc-info">
                                            <span className="doc-name">{doc.name}</span>
                                            <span className="doc-meta">{doc.size} | {doc.uploadedAt}</span>
                                        </div>
                                        <div className="doc-actions">
                                            <button type="button" className="doc-action-btn">
                                                <Download size={16} />
                                            </button>
                                            <button type="button" className="doc-action-btn delete" onClick={() => handleDeleteDoc(doc.id)}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="cancel-btn" onClick={onBack}>Cancel</button>
                        <button type="submit" className="save-btn" disabled={saving}>
                            <Save size={18} />
                            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                        </button>
                    </div>
                </form>
            </div>

            {/* Password Change Dialog */}
            {showPasswordDialog && (
                <div className="dialog-overlay" onClick={() => setShowPasswordDialog(false)}>
                    <div className="dialog-box" onClick={(e) => e.stopPropagation()}>
                        <div className="dialog-header">
                            <h3>Change Password</h3>
                            <button 
                                className="dialog-close-btn" 
                                onClick={() => setShowPasswordDialog(false)}
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="dialog-content">
                            <div className="dialog-form-group">
                                <label>Current Password</label>
                                <input
                                    type="password"
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData(prev => ({
                                        ...prev,
                                        currentPassword: e.target.value
                                    }))}
                                    placeholder="Enter current password"
                                />
                            </div>
                            <div className="dialog-form-group">
                                <label>New Password</label>
                                <input
                                    type="password"
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData(prev => ({
                                        ...prev,
                                        newPassword: e.target.value
                                    }))}
                                    placeholder="Enter new password"
                                />
                            </div>
                            <div className="dialog-form-group">
                                <label>Confirm New Password</label>
                                <input
                                    type="password"
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData(prev => ({
                                        ...prev,
                                        confirmPassword: e.target.value
                                    }))}
                                    placeholder="Confirm new password"
                                />
                            </div>
                        </div>
                        <div className="dialog-actions">
                            <button 
                                type="button" 
                                className="dialog-cancel-btn"
                                onClick={() => {
                                    setShowPasswordDialog(false);
                                    setPasswordData({
                                        currentPassword: '',
                                        newPassword: '',
                                        confirmPassword: ''
                                    });
                                }}
                            >
                                Cancel
                            </button>
                            <button 
                                type="button" 
                                className="dialog-save-btn"
                                onClick={async () => {
                                    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
                                        alert('Please fill all password fields');
                                        return;
                                    }
                                    
                                    if (passwordData.newPassword !== passwordData.confirmPassword) {
                                        alert('New password and confirm password do not match');
                                        return;
                                    }
                                    
                                    setChangingPassword(true);
                                    try {
                                        const result = await usersAPI.changePassword({
                                            currentPassword: passwordData.currentPassword,
                                            newPassword: passwordData.newPassword
                                        });
                                        
                                        if (result.success) {
                                            alert('Password changed successfully!');
                                            setShowPasswordDialog(false);
                                            setPasswordData({
                                                currentPassword: '',
                                                newPassword: '',
                                                confirmPassword: ''
                                            });
                                        } else {
                                            alert(result.message || 'Failed to change password');
                                        }
                                    } catch (error) {
                                        console.error('Error changing password:', error);
                                        alert('Error changing password. Please try again.');
                                    } finally {
                                        setChangingPassword(false);
                                    }
                                }}
                                disabled={changingPassword}
                            >
                                {changingPassword ? 'Changing...' : 'Change Password'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileEdit;

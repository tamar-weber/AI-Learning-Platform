import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import { validateUpdateDetailsForm } from '../utils/updateDetailsValidation';

function Updatedetails({ currentUser }) {
    const { updateAuthData } = useAuth();
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [profileErrors, setProfileErrors] = useState({});
    const [profileForm, setProfileForm] = useState({
        name: '',
        phone: '',
        email: ''
    });

    useEffect(() => {
        if (currentUser) {
            setProfileForm({
                name: currentUser.name || '',
                phone: currentUser.phone || '',
                email: currentUser.email || ''
            });
        }
    }, [currentUser]);

    const openEditProfileModal = () => {
        if (!currentUser) {
            return;
        }

        setProfileErrors({});
        setProfileForm({
            name: currentUser.name || '',
            phone: currentUser.phone || '',
            email: currentUser.email || ''
        });
        setIsEditProfileOpen(true);
    };

    const closeEditProfileModal = () => {
        if (isSavingProfile) {
            return;
        }

        setIsEditProfileOpen(false);
        setProfileErrors({});
    };

    const handleProfileChange = (event) => {
        const { name, value } = event.target;

        setProfileForm((prev) => ({
            ...prev,
            [name]: value
        }));

        if (profileErrors[name] || profileErrors.general) {
            setProfileErrors((prev) => ({
                ...prev,
                [name]: '',
                general: ''
            }));
        }
    };

    const handleSaveProfile = async (event) => {
        event.preventDefault();

        const errors = validateUpdateDetailsForm(profileForm);

        if (Object.keys(errors).length > 0) {
            setProfileErrors(errors);
            return;
        }

        setIsSavingProfile(true);

        try {
            const payload = {
                name: profileForm.name.trim(),
                phone: profileForm.phone.trim(),
                email: profileForm.email.trim()
            };

            const response = await api.patch('/profile', payload);
            updateAuthData(response.data);
            setIsEditProfileOpen(false);
        } catch (error) {
            setProfileErrors({
                general: error.response?.data?.error || 'שמירת הפרופיל נכשלה. נסה שוב.'
            });
        } finally {
            setIsSavingProfile(false);
        }
    };

    return (
        <>
            <button type="button" className="navbar-edit-profile-button" onClick={openEditProfileModal}>
                ✏️
            </button>

            {isEditProfileOpen && (
                <div className="profile-modal-overlay" onClick={closeEditProfileModal}>
                    <div className="profile-modal-card" onClick={(event) => event.stopPropagation()}>
                        <h3 className="profile-modal-title">עריכת פרופיל</h3>

                        <form className="profile-modal-form" onSubmit={handleSaveProfile}>
                            <label className="profile-modal-label" htmlFor="profile-name">שם</label>
                            <input
                                id="profile-name"
                                name="name"
                                value={profileForm.name}
                                onChange={handleProfileChange}
                                className={`profile-modal-input ${profileErrors.name ? 'error' : ''}`}
                            />
                            {profileErrors.name && <span className="profile-modal-error">{profileErrors.name}</span>}

                            <label className="profile-modal-label" htmlFor="profile-phone">טלפון</label>
                            <input
                                id="profile-phone"
                                name="phone"
                                value={profileForm.phone}
                                onChange={handleProfileChange}
                                className={`profile-modal-input ${profileErrors.phone ? 'error' : ''}`}
                            />
                            {profileErrors.phone && <span className="profile-modal-error">{profileErrors.phone}</span>}

                            <label className="profile-modal-label" htmlFor="profile-email">אימייל</label>
                            <input
                                id="profile-email"
                                name="email"
                                value={profileForm.email}
                                onChange={handleProfileChange}
                                className={`profile-modal-input ${profileErrors.email ? 'error' : ''}`}
                            />
                            {profileErrors.email && <span className="profile-modal-error">{profileErrors.email}</span>}

                            {profileErrors.general && <div className="profile-modal-general-error">{profileErrors.general}</div>}

                            <div className="profile-modal-actions">
                                <button type="button" className="profile-cancel-button" onClick={closeEditProfileModal} disabled={isSavingProfile}>
                                    ביטול
                                </button>
                                <button type="submit" className="profile-save-button" disabled={isSavingProfile}>
                                    {isSavingProfile ? 'שומר...' : 'שמור'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

export default Updatedetails;

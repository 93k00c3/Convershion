import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Profile.css";
import { FaUserCircle } from "react-icons/fa";


const EditProfileModal = ({ isOpen, onClose }) => {
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [newSurname, setNewSurname] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleSaveChanges = async (event) => {
    event.preventDefault(); 
    if (!newUsername && !newEmail && !newFirstName && !newSurname) {
        setIsError(true);
            setErrorMessage('No changes made');
            setTimeout(() => {
              setIsError(false);
            }, 2000);
        return;  // Don't send a request
    }
    try {
      const response = await axios.put("http://localhost:5000/profile", {
        username: newUsername,
        firstName: newFirstName,
        surname: newSurname,
        email: newEmail,
      },
      { withCredentials: true });
      console.log("Profile updated successfully:", response.data);
      onClose();
      
    } catch (error) {
        if (error.response) {
            console.error('Error updating profile:', error.response.data);
            setIsError(true);
            setErrorMessage(error.response.data.error);
          } else {
        setIsError(true);
            setErrorMessage(error.response.data.message);
            setTimeout(() => {
              setIsError(false);
            }, 2000);
        }
      console.error("Error updating user profile:", error);
    }
  };

  return (
    <div className={`modal ${isOpen ? 'open' : ''}`}>
      <div className="modal-content">
        <h2>Edit Profile</h2>
        <div className="input-container">
          <label htmlFor="newUsername">Username:</label>
          <input
            type="text"
            id="newUsername"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
          />
        </div>
        <div className="input-container">
          <label htmlFor="newEmail">Email:</label>
          <input
            type="text"
            id="newEmail"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />
        </div>
        <div className="input-container">
          <label htmlFor="newFirstName">First Name:</label>
          <input
            type="text"
            id="newFirstName"
            value={newFirstName}
            onChange={(e) => setNewFirstName(e.target.value)}
          />
        </div>
        <div className="input-container">
          <label htmlFor="newSurname">Surname:</label>
          <input
            type="text"
            id="newSurname"
            value={newSurname}
            onChange={(e) => setNewSurname(e.target.value)}
          />
        </div>
        {errorMessage && <p className="text-red-500">{errorMessage}</p>}
        <button onClick={handleSaveChanges}>Save Changes</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleSaveChanges = async () => {
    if (newPassword !== confirmPassword || newPassword === '') {
      console.log('Passwords do not match');
      return;
    }
    try {
      const response = await axios.put("http://localhost:5000/profile/change-password", {
        oldPassword: oldPassword,
        newPassword: newPassword,
      },
      { withCredentials: true });
      console.log("Password updated successfully:", response.data);
      onClose();
    } catch (error) {
            setIsError(true);
            setErrorMessage(error.response.data.message);
            setTimeout(() => {
              setIsError(false);
            }, 2000);
      console.error("Error updating user password:", error);
    }
  };

  return (
    <div className={`modal ${isOpen ? 'open' : ''}`}>
      <div className="modal-content">
        <h2>Change Password</h2>
        <div className="input-container">
          <label htmlFor="oldPassword">Old Password:</label>
          <input
            type="password"
            id="oldPassword"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
          />
        </div>
        <div className="input-container">
          <label htmlFor="newPassword">New Password:</label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <div className="input-container">
          <label htmlFor="confirmPassword">Confirm New Password:</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        {errorMessage && <p className="text-red-500">{errorMessage}</p>}
        <button onClick={handleSaveChanges}>Change Password</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const fetchProfileData = async () => {
    try {
      const response = await axios.get("http://localhost:5000/profile", {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });
      setUserData(response.data);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };
  useEffect(() => {
    fetchProfileData();
  }, []);

  

  const handleEditClick = () => {
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    fetchProfileData();
  };

  const handleOpenChangePasswordModal = () => {
    setIsChangePasswordModalOpen(true);
  };

  const handleCloseChangePasswordModal = () => {
    setIsChangePasswordModalOpen(false);
  };

  return (
    <div className="profile-card">
      <h2>User Profile</h2>
      {userData && (
        <div className="profile-content">
          <div className="profile-icon-container">
            <FaUserCircle className="profile-icon" />
          </div>
          <p>
            <strong>Username:</strong> {userData.username}
          </p>
          <p>
            <strong>Full name:</strong> {userData.firstName} {userData.lastName}
          </p>
          <p>
            <strong>Email:</strong> {userData.email}
          </p>
          <button onClick={handleEditClick}>Edit Profile</button>
          <button onClick={handleOpenChangePasswordModal}>Change Password</button>
          {isEditModalOpen && (
            <EditProfileModal isOpen={isEditModalOpen} onClose={handleCloseEditModal} />
          )}
          {isChangePasswordModalOpen && (
            <ChangePasswordModal isOpen={isChangePasswordModalOpen} onClose={handleCloseChangePasswordModal} />
          )}
        </div>
      )}
    </div>
  );
};

export default Profile;

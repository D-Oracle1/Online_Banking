'use client';

import { useState } from 'react';
import { User, FileText, XCircle, Eye } from 'lucide-react';
import ImageModal from './ImageModal';

interface UserData {
  id: string;
  fullName: string;
  email: string;
  username: string;
  phoneNumber: string | null;
  dateOfBirth: Date | null;
  gender: string | null;
  nationality: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  occupation: string | null;
  employer: string | null;
  annualIncome: string | null;
  profilePhoto: string | null;
  idType: string | null;
  idNumber: string | null;
  idDocument: string | null;
  verificationStatus: string | null;
  createdAt: Date;
}

export default function UserVerificationClient({ users }: { users: UserData[] }) {
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [viewingImage, setViewingImage] = useState<{ url: string; alt: string } | null>(null);

  const handleViewDetails = (user: UserData) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

  return (
    <div>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Documents
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {user.profilePhoto ? (
                        <img
                          src={user.profilePhoto}
                          alt={user.fullName}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
                        <div className="text-sm text-gray-500">@{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                    <div className="text-sm text-gray-500">{user.phoneNumber || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.idType || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{user.idNumber || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      {user.profilePhoto && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Photo
                        </span>
                      )}
                      {user.idDocument && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ID Doc
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.verificationStatus === 'verified'
                        ? 'bg-green-100 text-green-800'
                        : user.verificationStatus === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.verificationStatus || 'pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleViewDetails(user)}
                      className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No uploaded documents</h3>
            <p className="mt-1 text-sm text-gray-500">No users have uploaded verification documents yet.</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-8 my-8">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-gray-900">User Verification Details</h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Full Name</label>
                    <p className="text-sm text-gray-900">{selectedUser.fullName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-sm text-gray-900">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone Number</label>
                    <p className="text-sm text-gray-900">{selectedUser.phoneNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                    <p className="text-sm text-gray-900">
                      {selectedUser.dateOfBirth ? new Date(selectedUser.dateOfBirth).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Gender</label>
                    <p className="text-sm text-gray-900">{selectedUser.gender || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nationality</label>
                    <p className="text-sm text-gray-900">{selectedUser.nationality || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Address Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Street Address</label>
                    <p className="text-sm text-gray-900">{selectedUser.address || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">City</label>
                    <p className="text-sm text-gray-900">{selectedUser.city || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">State</label>
                    <p className="text-sm text-gray-900">{selectedUser.state || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Postal Code</label>
                    <p className="text-sm text-gray-900">{selectedUser.postalCode || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Country</label>
                    <p className="text-sm text-gray-900">{selectedUser.country || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Employment Information */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Employment Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Occupation</label>
                    <p className="text-sm text-gray-900">{selectedUser.occupation || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Employer</label>
                    <p className="text-sm text-gray-900">{selectedUser.employer || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Annual Income</label>
                    <p className="text-sm text-gray-900">{selectedUser.annualIncome || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* ID Information */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">ID Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">ID Type</label>
                    <p className="text-sm text-gray-900">{selectedUser.idType || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">ID Number</label>
                    <p className="text-sm text-gray-900">{selectedUser.idNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Registration Date</label>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedUser.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Uploaded Documents</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Profile Photo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Profile Photo</label>
                  {selectedUser.profilePhoto ? (
                    <div className="relative group">
                      <img
                        src={selectedUser.profilePhoto}
                        alt="Profile"
                        className="w-full h-64 object-cover rounded-lg border-2 border-gray-200 cursor-pointer hover:opacity-90 transition"
                        onClick={() => setViewingImage({ url: selectedUser.profilePhoto!, alt: 'Profile Photo' })}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition rounded-lg flex items-center justify-center">
                        <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                      <p className="text-gray-400">No photo uploaded</p>
                    </div>
                  )}
                  {selectedUser.profilePhoto && (
                    <p className="text-xs text-gray-500 text-center mt-2">Click to view full size</p>
                  )}
                </div>

                {/* ID Document */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ID Document</label>
                  {selectedUser.idDocument ? (
                    <div className="relative group">
                      <img
                        src={selectedUser.idDocument}
                        alt="ID Document"
                        className="w-full h-64 object-contain rounded-lg border-2 border-gray-200 cursor-pointer hover:opacity-90 transition"
                        onClick={() => setViewingImage({ url: selectedUser.idDocument!, alt: 'ID Document' })}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition rounded-lg flex items-center justify-center">
                        <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                      <p className="text-gray-400">No document uploaded</p>
                    </div>
                  )}
                  {selectedUser.idDocument && (
                    <p className="text-xs text-gray-500 text-center mt-2">Click to view full size</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={handleCloseModal}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {viewingImage && (
        <ImageModal
          imageUrl={viewingImage.url}
          alt={viewingImage.alt}
          onClose={() => setViewingImage(null)}
        />
      )}
    </div>
  );
}

// import React from 'react';
// import getApiBaseUrl from '../../config/apiConfig';

// const GroupDetailsCard = ({ group, onDeleteClick, onToggleAdminSearch, showAdminSearch, onEditClick }) => {
//   return (
//     <div className="group-card">
//       <div className="group-content">
//         <div className="group-image-container">
//           <img
//             src={group?.groupImage ? `${group.groupImage}?t=${Date.now()}` : `${getApiBaseUrl()}/images/placeholder.jpg`}
//             alt={group?.groupName}
//             className="group-image"
//             loading="lazy"
//             onError={(e) => { e.target.src = `${getApiBaseUrl()}/images/placeholder.jpg`; }}           
//           />
//         </div>
//         <div className="group-info">
//           <h2>Group Information</h2>
//           <p>{group?.description || 'No description available'}</p>

//            <div className="group-info-grid">
//              {[
//               { label: 'City', value: group?.cityName },
//               { label: 'Sport', value: group?.sportName },
//               { label: 'Members', value: `${group?.totalMembers}/${group?.maxMemNum}` },
//               { label: 'Minimum Age', value: group?.minAge },
//               { label: 'Gender', value: group?.gender },
//               { label: 'Founded', value: new Date(group?.foundedAt).toLocaleDateString() }
//             ].map((item, index) => (
//               <div className="group-info-item" key={index}>
//                 <strong>{item.label}</strong>
//                 <span>{item.value}</span>
//               </div>
//             ))}
//           </div>
//           <div className="admin-info">
//             <img
//               src={group?.groupAdminImage ? `${group.groupAdminImage}?t=${Date.now()}` : `${getApiBaseUrl()}/images/placeholder.jpg`}              alt={group?.groupAdminName}
//               className="admin-image"
//               loading="lazy"
//               onError={(e) => { e.target.src = `${getApiBaseUrl()}/images/placeholder.jpg`; }}              
//             />
//             <div>
//               <strong>Group Admin</strong>
//               <p>{group?.groupAdminName}</p>
//             </div>
//           </div>
//         </div>
//       </div>
//       <div className="group-actions">
//         <button className="delete-btn" onClick={onDeleteClick}>
//           Delete Group
//         </button>
//         <button className="edit-admin-btn" onClick={onToggleAdminSearch}>
//           {showAdminSearch ? 'Cancel Edit' : 'Change Admin'}
//         </button>
//         <button className="edit-btn" onClick={onEditClick}>
//           Edit Details
//         </button>
//       </div>
//     </div>
//   );
// };

// export default GroupDetailsCard;



import React from 'react';
import { SPORT_TYPES } from '../../constants/sportTypes';
import getApiBaseUrl from '../../config/apiConfig';

const GroupDetailsCard = ({ group, onDeleteClick, onToggleAdminSearch, showAdminSearch, onEditClick }) => {
  // Format date to MM/DD/YYYY
  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
  };

  return (
    <div className="group-details-card">
      <div className="group-content">
        <div className="group-image-container">
          <img
            src={group?.groupImage ? `${getApiBaseUrl()}/images/${group.groupImage}` : `${getApiBaseUrl()}/images/placeholder.jpg`}
            alt={group?.groupName}
            className="group-image"
            loading="lazy"
            onError={(e) => { 
              e.target.src = `${getApiBaseUrl()}/images/placeholder.jpg`;
            }}           
          />
        </div>
        <div className="group-info">
          <h2>{group?.groupName}</h2>
          <p className="group-description">{group?.description || 'No description available'}</p>
          <div className="group-info-grid">
            <div className="group-info-item">
              <strong>City</strong>
              <span>{group?.cityName}</span>
            </div>
            <div className="group-info-item">
              <strong>Sport</strong>
              <span>{group?.sportName}</span>
            </div>
            <div className="group-info-item">
              <strong>Members</strong>
              <span>{`${group?.totalMembers}/${group?.maxMemNum}`}</span>
            </div>
            <div className="group-info-item">
              <strong>Minimum Age</strong>
              <span>{group?.minAge}</span>
            </div>
            <div className="group-info-item">
              <strong>Gender</strong>
              <span>{group?.gender}</span>
            </div>
            <div className="group-info-item">
              <strong>Founded</strong>
              <span>{formatDate(group?.foundedAt)}</span>
            </div>
          </div>
          <div className="admin-info">
            <img
              src={group?.groupAdminImage ? `${getApiBaseUrl()}/images/${group.groupAdminImage}` : `${getApiBaseUrl()}/images/placeholder.jpg`}
              alt={group?.groupAdminName}
              className="admin-image"
              loading="lazy"
              onError={(e) => { 
                e.target.src = `${getApiBaseUrl()}/images/placeholder.jpg`;
              }}              
            />
            <div>
              <strong>Group Admin</strong>
              <p>{group?.groupAdminName}</p>
            </div>
          </div>
          <div className="group-actions">
            <button onClick={onDeleteClick} className="delete-btn">
              Delete Group
            </button>
            <button onClick={onToggleAdminSearch} className="edit-admin-btn">
              {showAdminSearch ? 'Cancel Admin Change' : 'Change Admin'}
            </button>
            <button onClick={onEditClick} className="edit-details-btn">
              Edit Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupDetailsCard;
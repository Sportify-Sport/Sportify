import React from 'react';
import GroupCard from './GroupCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import ShowMoreButton from '../ShowMoreButton';

const GroupsGrid = ({ groups, loading, hasMore, onShowMore, cityName }) => {
  return (
    <div className="groups-container">
      <div className="groups-grid responsive-grid">
        {groups.map(group => (
          <GroupCard key={group.groupId} group={group} cityName={cityName} />
        ))}
      </div>
      
      {loading && groups.length === 0 && (
        <LoadingSpinner text="Loading groups..." />
      )}
      
      <ShowMoreButton 
        onClick={onShowMore}
        hasMore={hasMore}
        isLoading={loading && groups.length > 0}
      />
      
      {groups.length === 0 && !loading && (
        <div className="no-results">No groups found</div>
      )}
    </div>
  );
};

export default GroupsGrid;
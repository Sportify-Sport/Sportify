import React, { useEffect, useRef } from 'react';
import GroupCard from './GroupCard';
import LoadingSpinner from '../../components/LoadingSpinner';

const GroupsGrid = ({ groups, loading, hasMore, onShowMore, cityName }) => {
  const sentinelRef = useRef(null);
  const validGroups = groups?.filter((group) => group && group.groupId) || [];
  useEffect(() => {
    if (!hasMore || loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onShowMore();
        }
      },
      { root: null, rootMargin: '100px', threshold: 0.1 }
    );
    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }
    return () => {
      if (sentinelRef.current) {
        observer.unobserve(sentinelRef.current);
      }
    };
  }, [hasMore, loading, onShowMore]);

  return (
    <div className="selection-container">
      <div className="items-grid responsive-grid">
        {validGroups.map((group) => (
          <GroupCard key={group.groupId} group={group} cityName={cityName} />
        ))}
      </div>
      
      {loading && validGroups.length === 0 && (
        <LoadingSpinner text="Loading groups..." />
      )}
      
     {hasMore && !loading && (
        <div ref={sentinelRef} className="infinite-scroll-sentinel" />
      )}

      {loading && validGroups.length > 0 && (
        <LoadingSpinner text="Loading more groups..." />
      )}
      
      {validGroups.length === 0 && !loading && (
        <div className="no-results">No groups found</div>
      )}
    </div>
  );
};

export default GroupsGrid;
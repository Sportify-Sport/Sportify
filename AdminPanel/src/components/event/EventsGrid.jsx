import React, { useEffect, useRef } from 'react';
import EventCard from './EventCard';
import LoadingSpinner from '../LoadingSpinner';

const EventsGrid = ({ events, loading, hasMore, onShowMore, cityName }) => {
  const sentinelRef = useRef(null);

  const validEvents = events?.filter((event) => event && event.eventId) || [];

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
      <div className="selection-grid responsive-grid">
        {validEvents.map((event) => (
          <EventCard key={event.eventId} event={event} cityName={cityName} />
        ))}
      </div>

      {loading && validEvents.length === 0 && (
        <LoadingSpinner text="Loading events..." />
      )}

      {hasMore && !loading && (
        <div ref={sentinelRef} className="infinite-scroll-sentinel" />
      )}

      {loading && validEvents.length > 0 && (
        <LoadingSpinner text="Loading more events..." />
      )}

      {validEvents.length === 0 && !loading && (
        <div className="no-results">No events found</div>
      )}
    </div>
  );
};

export default EventsGrid;
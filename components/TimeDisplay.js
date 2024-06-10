import React, { useEffect, useState } from 'react';

const TimeDisplay = ({ createdAt }) => {
    const [timeAgo, setTimeAgo] = useState('');

    useEffect(() => {
        const calculateTimeSince = (date) => {
            const now = new Date();
            const createdDate = new Date(date);
            const diffInSeconds = Math.floor((now - createdDate) / 1000);

            const minutes = Math.floor(diffInSeconds / 60);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);
            const weeks = Math.floor(days / 7);
            const months = Math.floor(days / 30);  // Approximate month calculation
            
            if (months > 0) {
                return `Edited ${months} month${months !== 1 ? 's' : ''} ago`;
            } else if (weeks > 0) {
                return `Edited ${weeks} week${weeks !== 1 ? 's' : ''} ago`;
            } else if (days > 0) {
                return `Edited ${days} day${days !== 1 ? 's' : ''} ago`;
            } else if (hours > 0) {
                return `Edited ${hours} hour${hours !== 1 ? 's' : ''} ago`;
            } else {
                return `Edited ${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
            }
        };

        setTimeAgo(calculateTimeSince(createdAt));
    }, [createdAt]);

    return (
        <p className='text-xs text-gray-500'>{timeAgo}</p>
    );
};

export default TimeDisplay;
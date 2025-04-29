import React, { useState } from 'react';

/**
 * RacketImage component for displaying racket images with fallback
 * @param {string} src - Source URL for the racket image
 * @param {string} alt - Alt text for the image
 * @param {object} style - Style object to apply to the image
 * @param {string} className - CSS class(es) to apply to the image
 * @returns {JSX.Element} - Image component with fallback handling
 */
const RacketImage = ({ src, alt, style, className }) => {
  const [error, setError] = useState(false);
  const fallbackSrc = "https://padelmagazine.fr/wp-content/uploads/2018/10/LOGO-Raquette-Padel-Noir.jpg.webp";

  const handleError = () => {
    setError(true);
  };

  return (
    <img
      src={error || !src ? fallbackSrc : src}
      alt={alt || "Racket image"}
      style={style}
      className={className}
      onError={handleError}
    />
  );
};

export default RacketImage;
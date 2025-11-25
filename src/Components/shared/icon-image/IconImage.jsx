import React from "react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { Link } from "react-router-dom";
import { INDEX_ROUTE } from "../../../core/routes/Pages";

const IconImage = () => {
  return (
    <Link to={INDEX_ROUTE}>
      <LazyLoadImage
        alt={"mtn-logo"}
        src={"/logo/logo.png"}
        width={120}
        height={60}
      />
    </Link>
  );
};

export default IconImage;

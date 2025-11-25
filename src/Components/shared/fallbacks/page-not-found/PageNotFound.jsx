import React from "react";
import { INDEX_ROUTE } from "../../../../core/routes/Pages";
import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

const PageNotFound = () => {
  const navigate = useNavigate();
  return (
    <div
      className={
        "flex flex-col gap-4 w-full max-w-xxl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 items-center justify-center text-center"
      }
    >
      <h1>Page Not Found</h1>
      <p>{`Sorry, the page you are looking for doesn't exist.`}</p>
      <Button
        variant="contained"
        color="primary"
        onClick={() => navigate(INDEX_ROUTE)}
        className="mt-20 px-6 py-10 rounded-lg shadow-lg"
      >
        Back to Users
      </Button>
    </div>
  );
};

export default PageNotFound;

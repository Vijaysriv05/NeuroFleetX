import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Avatar, Typography, Paper } from "@mui/material";

const DashboardHeader = ({ title }) => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mb: 4,
      }}
    >
      {/* Dashboard Title - Left */}
      <Typography variant="h5" fontWeight="bold">
        {title}
      </Typography>

      {/* Profile Card - Right */}
      <Paper
        elevation={3}
        onClick={() => navigate("/profile")}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          px: 2,
          py: 1.5,
          borderRadius: 2,
          cursor: "pointer",
          width: 230,
          "&:hover": {
            boxShadow: 6,
          },
        }}
      >
        <Avatar sx={{ bgcolor: "primary.main" }}>U</Avatar>

        <Box>
          <Typography fontWeight="bold">My Profile</Typography>
          <Typography variant="body2" color="text.secondary">
            View & Edit
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default DashboardHeader;






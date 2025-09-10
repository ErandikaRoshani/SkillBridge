import React, { useEffect,useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Chip,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  AccountCircle,
  ExitToApp,
  CalendarToday,
  Book,
  Code,
  Work,
  Person,
  Menu as MenuIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import useUser from '../services/UserContext';

const Header = ({  role, onSignOut, token }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [userName, setUserName] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const {user} = useUser();

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNavigation = (path) => {
    navigate(path);
    handleMenuClose();
  };

  const handleSignOutClick = () => {
    handleMenuClose();
    onSignOut();
  };

     useEffect(() => {
    const userData =  fetchUserById(user);
    }, [user]);

      const fetchUserById = async (id) => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/users/getUserById/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setUserName(response.data.name)
        return response.data;
      } catch (error) {
        console.error(`Error fetching user ${id}:`, error);
        return { name: id }; // Fallback to ID if error
      }
    };

  // Common navigation items for both roles
  const commonMenuItems = [
    { label: 'Calendar', path: '/calendar', icon: <CalendarToday /> },
    { label: 'Code Reviews', path: '/code-reviews', icon: <Code /> },
  ];

  // Role-specific navigation items
  const mentorMenuItems = [
    { label: 'Service Packages', path: '/packages', icon: <Work /> },
    { label: 'Bookings', path: '/mentor-bookings', icon: <Book /> },
  ];

  const menteeMenuItems = [
    { label: 'Find Mentors', path: '/mentors', icon: <Person /> },
    { label: 'Bookings', path: '/mentee-bookings', icon: <Book /> },
  ];

  const menuItems = [
    ...commonMenuItems,
    ...(role === 'mentor' ? mentorMenuItems : menteeMenuItems),
  ];

  const menuId = 'primary-search-account-menu';
  const isMenuOpen = Boolean(anchorEl);

  const renderMenu = (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      id={menuId}
      keepMounted
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      open={isMenuOpen}
      onClose={handleMenuClose}
    >
      <Box sx={{ px: 2, py: 1 }}>
        <Typography variant="subtitle1" fontWeight="bold">
          {userName|| user?.attributes?.email}
        </Typography>
        <Chip 
          label={role} 
          size="small" 
          color={role === 'mentor' ? 'primary' : 'secondary'} 
          sx={{ mt: 0.5 }}
        />
      </Box>
      <Divider />
      {menuItems.map((item) => (
        <MenuItem key={item.path} onClick={() => handleNavigation(item.path)}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {item.icon}
            {item.label}
          </Box>
        </MenuItem>
      ))}
      <Divider />
      <MenuItem onClick={handleSignOutClick}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ExitToApp />
          Sign Out
        </Box>
      </MenuItem>
    </Menu>
  );

  return (
    <>
      <AppBar position="static" elevation={2}>
        <Toolbar>
          {/* Logo/Brand */}
          <Typography
            variant="h6"
            component="div"
            sx={{ 
              flexGrow: 1, 
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
            onClick={() => navigate('/')}
          >
            SkillBridge
          </Typography>

          {/* Desktop Navigation */}
          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 1, mr: 2 }}>
              {commonMenuItems.map((item) => (
                <Button
                  key={item.path}
                  color="inherit"
                  startIcon={item.icon}
                  onClick={() => handleNavigation(item.path)}
                >
                  {item.label}
                </Button>
              ))}
              {role === 'mentor' 
                ? mentorMenuItems.map((item) => (
                    <Button
                      key={item.path}
                      color="inherit"
                      startIcon={item.icon}
                      onClick={() => handleNavigation(item.path)}
                    >
                      {item.label}
                    </Button>
                  ))
                : menteeMenuItems.map((item) => (
                    <Button
                      key={item.path}
                      color="inherit"
                      startIcon={item.icon}
                      onClick={() => handleNavigation(item.path)}
                    >
                      {item.label}
                    </Button>
                  ))
              }
            </Box>
          )}

          {/* Mobile Menu Button */}
          {isMobile && (
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="open menu"
              sx={{ mr: 2 }}
              onClick={handleProfileMenuOpen}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* User Profile */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {!isMobile && (
              <Typography variant="body2" sx={{ mr: 1 }}>
                Hello, {userName || 'User'}
              </Typography>
            )}
            <IconButton
              size="large"
              edge="end"
              aria-label="account of current user"
              aria-controls={menuId}
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <Avatar 
                sx={{ 
                  width: 32, 
                  height: 32, 
                  bgcolor: role === 'mentor' ? 'primary.main' : 'secondary.main' 
                }}
              >
                {user?.username?.[0]?.toUpperCase() || <AccountCircle />}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      {renderMenu}
    </>
  );
};

export default Header;
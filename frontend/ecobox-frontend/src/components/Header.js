// components/Header.js
import React from 'react';
import { useAuth } from '../context/AuthContext';
import './Header.css';

const Header = ({ toggleSidebar }) => {
  const { user } = useAuth();

 
};

export default Header;
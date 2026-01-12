// src/pages/Register.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    username: '',
    telefono: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({
    nombre: '',
    apellido: '',
    email: '',
    username: '',
    telefono: '',
    password: '',
    confirmPassword: '',
    general: ''
  });

  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: '',
    level: 'Débil'
  });

  const [touched, setTouched] = useState({
    nombre: false,
    apellido: false,
    email: false,
    username: false,
    telefono: false,
    password: false,
    confirmPassword: false
  });

  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Validación de email optimizada
  const validateEmail = (email) => {
    if (!email || typeof email !== 'string') {
      return false;
    }

    const trimmedEmail = email.trim();
    
    if (trimmedEmail.length <= 3) {
      return false;
    }

    const emailRegex = /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-zA-Z0-9-]*[a-zA-Z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/i;
    
    if (!emailRegex.test(trimmedEmail)) {
      return false;
    }

    const parts = trimmedEmail.split('@');
    if (parts.length !== 2) {
      return false;
    }

    const [localPart, domainPart] = parts;

    if (localPart.length === 0 || localPart.length > 64) {
      return false;
    }

    if (domainPart.length === 0 || domainPart.length > 255) {
      return false;
    }

    if (domainPart.length <= 3) {
      return false;
    }

    if (!domainPart.includes('.')) {
      return false;
    }

    const domainLabels = domainPart.split('.');
    
    if (domainLabels.length < 2) {
      return false;
    }

    for (const label of domainLabels) {
      if (label.length === 0 || label.length > 63) {
        return false;
      }
      
      if (label.startsWith('-') || label.endsWith('-')) {
        return false;
      }
      
      const labelRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/;
      if (!labelRegex.test(label)) {
        return false;
      }
    }

    const tld = domainLabels[domainLabels.length - 1];
    if (tld.length < 2) {
      return false;
    }

    if (domainPart.includes('..')) {
      return false;
    }

    if (domainPart.startsWith('.') || domainPart.endsWith('.')) {
      return false;
    }

    return true;
  };

  const getEmailValidationFeedback = (email) => {
    if (!email) {
      return 'El email es requerido';
    }

    const trimmedEmail = email.trim();
    
    if (trimmedEmail.length === 0) {
      return 'El email no puede estar vacío';
    }

    if (trimmedEmail.length <= 3) {
      return 'El email debe tener más de 3 caracteres';
    }

    if (trimmedEmail.length > 254) {
      return 'El email es demasiado largo (máximo 254 caracteres)';
    }

    const parts = trimmedEmail.split('@');
    
    if (parts.length !== 2) {
      return 'Formato de email inválido. Debe contener un @';
    }

    const [localPart, domainPart] = parts;

    if (localPart.length === 0) {
      return 'Falta la parte antes del @';
    }

    if (localPart.length > 64) {
      return 'La parte antes del @ es demasiado larga (máximo 64 caracteres)';
    }

    if (domainPart.length === 0) {
      return 'Falta el dominio después del @';
    }

    if (domainPart.length <= 3) {
      return 'El dominio debe tener más de 3 caracteres';
    }

    if (!domainPart.includes('.')) {
      return 'El dominio debe contener al menos un punto (.)';
    }

    if (domainPart.startsWith('.') || domainPart.endsWith('.')) {
      return 'El dominio no puede empezar ni terminar con punto';
    }

    if (domainPart.includes('..')) {
      return 'El dominio no puede tener puntos consecutivos';
    }

    const domainLabels = domainPart.split('.');
    if (domainLabels.length < 2) {
      return 'El dominio debe tener al menos una extensión (ej: .com)';
    }

    const tld = domainLabels[domainLabels.length - 1];
    if (tld.length < 2) {
      return 'La extensión del dominio debe tener al menos 2 caracteres';
    }

    if (!validateEmail(trimmedEmail)) {
      return 'Formato de email inválido. Ejemplo válido: usuario@dominio.com';
    }

    return '';
  };

  // Validación de teléfono internacional mejorada
  const validatePhone = (phone) => {
    if (!phone || phone.trim() === '') {
      return { isValid: true, formatted: '' };
    }

    const trimmedPhone = phone.trim();
    const cleanedPhone = trimmedPhone.replace(/[^\d+\s()\-]/g, '');
    const digitsOnly = cleanedPhone.replace(/\D/g, '');
    
    if (digitsOnly.length === 0) {
      return { 
        isValid: false, 
        message: 'El teléfono debe contener números'
      };
    }
    
    if (digitsOnly.length < 7) {
      return { 
        isValid: false, 
        message: 'El teléfono es demasiado corto (mínimo 7 dígitos)'
      };
    }
    
    if (digitsOnly.length > 15) {
      return { 
        isValid: false, 
        message: 'El teléfono es demasiado largo (máximo 15 dígitos)'
      };
    }
    
    // Detectar números inválidos
    const allSameDigits = /^(\d)\1{6,}$/.test(digitsOnly);
    if (allSameDigits) {
      return { 
        isValid: false, 
        message: 'Número inválido. No se permiten secuencias repetidas'
      };
    }
    
    // Detectar secuencias consecutivas
    const isSequential = (numStr) => {
      let isAscending = true;
      let isDescending = true;
      
      for (let i = 1; i < numStr.length; i++) {
        const current = parseInt(numStr[i]);
        const previous = parseInt(numStr[i-1]);
        
        if (current !== previous + 1) isAscending = false;
        if (current !== previous - 1) isDescending = false;
        
        if (!isAscending && !isDescending) break;
      }
      
      return isAscending || isDescending;
    };
    
    if (isSequential(digitsOnly)) {
      return { 
        isValid: false, 
        message: 'Número inválido. No se permiten secuencias consecutivas'
      };
    }
    
    // Detectar muchos ceros
    const startsWithManyZeros = /^0{4,}/.test(digitsOnly);
    if (startsWithManyZeros) {
      return { 
        isValid: false, 
        message: 'Número inválido. Demasiados ceros al inicio'
      };
    }
    
    const zeroCount = (digitsOnly.match(/0/g) || []).length;
    if (zeroCount / digitsOnly.length > 0.8) {
      return { 
        isValid: false, 
        message: 'Número inválido. Demasiados ceros'
      };
    }
    
    // Detectar patrones repetitivos
    const hasRepetitivePattern = (numStr) => {
      if (numStr.length >= 7) {
        for (let patternLength = 1; patternLength <= Math.floor(numStr.length / 2); patternLength++) {
          const pattern = numStr.substring(0, patternLength);
          let isRepetitive = true;
          
          for (let i = patternLength; i < numStr.length; i += patternLength) {
            const segment = numStr.substring(i, i + patternLength);
            if (segment !== pattern.substring(0, segment.length)) {
              isRepetitive = false;
              break;
            }
          }
          
          if (isRepetitive && patternLength < numStr.length) return true;
        }
      }
      return false;
    };
    
    if (hasRepetitivePattern(digitsOnly)) {
      return { 
        isValid: false, 
        message: 'Número inválido. Patrón repetitivo detectado'
      };
    }
    
    // Números de prueba
    const testNumbers = [
      '1234567', '12345678', '123456789', '1111111', '2222222', '3333333',
      '4444444', '5555555', '6666666', '7777777', '8888888', '9999999',
      '0000000', '0123456', '1231231', '3213213', '4564564', '6546546',
      '1212121', '2121212', '1234123', '4321432', '1112222', '2221111',
      '00000000', '11111111', '22222222', '33333333', '44444444', '55555555',
      '66666666', '77777777', '88888888', '99999999', '12312312', '32132132',
      '000111222', '111000222', '222111000', '000123456', '123000456'
    ];
    
    if (testNumbers.includes(digitsOnly) || testNumbers.includes(digitsOnly.substring(0, 7))) {
      return { 
        isValid: false, 
        message: 'Por favor, ingresa un número de teléfono real'
      };
    }
    
    // Validar formato
    const internationalRegex = /^(\+?\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/;
    
    if (!internationalRegex.test(cleanedPhone)) {
      return { 
        isValid: false, 
        message: 'Formato de teléfono inválido'
      };
    }
    
    // Validar código de país
    if (cleanedPhone.startsWith('+')) {
      const validCountryCodes = [
        '+1', '+7', '+20', '+27', '+30', '+31', '+32', '+33', '+34', '+36',
        '+39', '+40', '+41', '+43', '+44', '+45', '+46', '+47', '+48', '+49',
        '+51', '+52', '+53', '+54', '+55', '+56', '+57', '+58', '+60', '+61',
        '+62', '+63', '+64', '+65', '+66', '+81', '+82', '+84', '+86', '+90',
        '+91', '+92', '+93', '+94', '+95', '+98'
      ];
      
      const countryCodeMatch = cleanedPhone.match(/^\+\d{1,3}/);
      if (!countryCodeMatch || !validCountryCodes.includes(countryCodeMatch[0])) {
        return { 
          isValid: false, 
          message: 'Código de país no válido'
        };
      }
    }
    
    // Verificar dígitos únicos
    const uniqueDigits = new Set(digitsOnly.split(''));
    if (uniqueDigits.size <= 2 && digitsOnly.length >= 7) {
      return { 
        isValid: false, 
        message: 'Número inválido. Demasiados dígitos repetidos'
      };
    }
    
    return {
      isValid: true,
      formatted: digitsOnly,
      message: '',
      international: cleanedPhone.startsWith('+') ? cleanedPhone : `+${digitsOnly}`
    };
  };

  // Formatear teléfono mientras se escribe
  const formatPhoneInput = (value) => {
    if (!value) return '';
    
    const cleaned = value.replace(/[^\d+]/g, '');
    if (cleaned.length === 0) return '';
    
    if (cleaned.startsWith('+')) {
      const afterPlus = cleaned.substring(1);
      const numbers = afterPlus.replace(/\D/g, '');
      const limitedNumbers = numbers.substring(0, 15);
      const formatted = limitedNumbers.replace(/(\d{3})(?=\d)/g, '$1 ');
      return `+${formatted}`;
    }
    
    const numbers = cleaned.replace(/\D/g, '');
    const limitedNumbers = numbers.substring(0, 15);
    
    if (limitedNumbers.length <= 3) {
      return limitedNumbers;
    } else if (limitedNumbers.length <= 6) {
      return `${limitedNumbers.slice(0, 3)} ${limitedNumbers.slice(3)}`;
    } else if (limitedNumbers.length <= 9) {
      return `${limitedNumbers.slice(0, 3)} ${limitedNumbers.slice(3, 6)} ${limitedNumbers.slice(6)}`;
    } else {
      return `${limitedNumbers.slice(0, 3)} ${limitedNumbers.slice(3, 6)} ${limitedNumbers.slice(6, 9)} ${limitedNumbers.slice(9)}`;
    }
  };

  // Validación de nombre de usuario
  const validateUsername = (username) => {
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    return usernameRegex.test(username);
  };

  // Medidor de fortaleza de contraseña
  const checkPasswordStrength = (password) => {
    let score = 0;
    let feedback = [];

    if (!password) {
      return { score: 0, feedback: '', level: 'Débil' };
    }

    if (password.length >= 8) score += 1;
    else feedback.push('Al menos 8 caracteres');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Agregar mayúsculas');

    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Agregar minúsculas');

    if (/[0-9]/.test(password)) score += 1;
    else feedback.push('Agregar números');

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
    else feedback.push('Agregar caracteres especiales');

    const emailParts = formData.email.split('@')[0];
    const nombreLower = formData.nombre.toLowerCase();
    const usernameLower = formData.username.toLowerCase();
    
    if (password.toLowerCase().includes(emailParts) ||
        password.toLowerCase().includes(nombreLower) ||
        password.toLowerCase().includes(usernameLower)) {
      score = Math.max(0, score - 1);
      feedback.push('No usar información personal');
    }

    let strengthLevel;
    if (score >= 4) strengthLevel = 'Fuerte';
    else if (score >= 3) strengthLevel = 'Moderada';
    else strengthLevel = 'Débil';

    return {
      score,
      feedback: feedback.length > 0 ? feedback.join(', ') : strengthLevel,
      level: strengthLevel
    };
  };

  // Validación en tiempo real
  const validateField = (name, value) => {
    let error = '';

    switch (name) {
      case 'nombre':
        if (!value.trim()) error = 'El nombre es requerido';
        else if (value.length < 2) error = 'Mínimo 2 caracteres';
        else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) error = 'Solo letras y espacios';
        break;

      case 'apellido':
        if (value && value.length < 2) error = 'Mínimo 2 caracteres';
        else if (value && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) error = 'Solo letras y espacios';
        break;

      case 'email':
        error = getEmailValidationFeedback(value);
        break;

      case 'username':
        if (!value) error = 'El nombre de usuario es requerido';
        else if (value.length < 3) error = 'Mínimo 3 caracteres';
        else if (value.length > 20) error = 'Máximo 20 caracteres';
        else if (!validateUsername(value)) error = 'Solo letras, números y _';
        break;

      case 'telefono':
        if (value && value.trim() !== '') {
          const phoneValidation = validatePhone(value);
          if (!phoneValidation.isValid) {
            error = phoneValidation.message;
          }
        }
        break;

      case 'password':
        if (!value) error = 'La contraseña es requerida';
        else if (value.length < 8) error = 'Mínimo 8 caracteres';
        else {
          const strength = checkPasswordStrength(value);
          if (strength.score < 3) {
            error = 'Contraseña muy débil';
          }
        }
        break;

      case 'confirmPassword':
        if (!value) error = 'Confirma tu contraseña';
        else if (value !== formData.password) error = 'Las contraseñas no coinciden';
        break;

      default:
        break;
    }

    return error;
  };

  // Manejar cambios en tiempo real
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    let processedValue = value;
    
    if (name === 'telefono') {
      processedValue = formatPhoneInput(value);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));

    if (touched[name]) {
      const error = validateField(name, processedValue);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }

    if (name === 'password') {
      setPasswordStrength(checkPasswordStrength(value));
    }

    if (name === 'password' && touched.confirmPassword) {
      const confirmError = validateField('confirmPassword', formData.confirmPassword);
      setErrors(prev => ({
        ...prev,
        confirmPassword: confirmError
      }));
    }

    if (name === 'email' && touched.email) {
      const emailError = getEmailValidationFeedback(value);
      setErrors(prev => ({
        ...prev,
        email: emailError
      }));
    }
  };

  // Manejar cuando el usuario sale del campo
  const handleBlur = (e) => {
    const { name, value } = e.target;
    
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));

    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  // Verificar si el formulario es válido
  const isFormValid = () => {
    const requiredFields = ['nombre', 'email', 'username', 'password', 'confirmPassword'];
    const hasErrors = Object.keys(errors).some(key => 
      key !== 'general' && errors[key] && errors[key] !== ''
    );
    
    const allRequiredFilled = requiredFields.every(field => 
      formData[field] && formData[field].trim().length > 0
    );
    
    const allTouched = requiredFields.every(field => touched[field]);
    
    return allRequiredFilled && !hasErrors && allTouched && passwordStrength.score >= 3;
  };

  // Color para la barra de fortaleza
  const getStrengthColor = () => {
    if (passwordStrength.score >= 4) return '#4caf50';
    if (passwordStrength.score >= 3) return '#ff9800';
    return '#f44336';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors(prev => ({ ...prev, general: '' }));
    
    const allTouched = {};
    Object.keys(touched).forEach(key => {
      allTouched[key] = true;
    });
    setTouched(allTouched);

    const newErrors = {};
    Object.keys(formData).forEach(key => {
      newErrors[key] = validateField(key, formData[key]);
    });
    setErrors(newErrors);

    const hasErrors = Object.values(newErrors).some(error => error && error !== '');
    
    if (hasErrors || passwordStrength.score < 3) {
      setErrors(prev => ({
        ...prev,
        general: 'Por favor, corrige los errores en el formulario'
      }));
      setLoading(false);
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      setErrors(prev => ({
        ...prev,
        password: 'Debe tener mayúsculas, minúsculas, números y caracteres especiales',
        general: 'La contraseña no cumple los requisitos'
      }));
      setLoading(false);
      return;
    }

    let formattedPhone = '';
    if (formData.telefono && formData.telefono.trim() !== '') {
      const phoneValidation = validatePhone(formData.telefono);
      if (!phoneValidation.isValid) {
        setErrors(prev => ({
          ...prev,
          telefono: phoneValidation.message,
          general: 'Error en el formato del teléfono'
        }));
        setLoading(false);
        return;
      }
      formattedPhone = phoneValidation.formatted;
    }

    const submitData = {
      ...formData,
      telefono: formattedPhone
    };

    try {
      const response = await fetch('http://localhost:8000/api/auth/registro/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.user) {
          await login({ 
            email: formData.email, 
            password: formData.password 
          });
        }
        
        navigate('/dashboard', { 
          state: { message: '¡Registro exitoso! Bienvenido a EcoBox' } 
        });
      } else {
        let serverError = data.error || 'Error en el registro';
        
        if (data.email) serverError = `Email: ${Array.isArray(data.email) ? data.email[0] : data.email}`;
        else if (data.username) serverError = `Usuario: ${Array.isArray(data.username) ? data.username[0] : data.username}`;
        else if (data.telefono) serverError = `Teléfono: ${Array.isArray(data.telefono) ? data.telefono[0] : data.telefono}`;
        else if (data.detail) serverError = data.detail;
        
        setErrors(prev => ({
          ...prev,
          general: serverError
        }));
      }
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        general: 'Error de conexión. Por favor, intenta nuevamente.'
      }));
      console.error('Error en registro:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="logo-icon">🌱</span>
            <h1>EcoBox</h1>
          </div>
          <h2>Crear Cuenta</h2>
          <p>Únete a la comunidad EcoBox</p>
        </div>

        {errors.general && (
          <div className="auth-error">
            <span>⚠️</span>
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nombre">Nombre *</label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                disabled={loading}
                className={touched.nombre && errors.nombre ? 'input-error' : ''}
                placeholder="Ej: Juan"
              />
              {touched.nombre && errors.nombre && (
                <span className="error-message">{errors.nombre}</span>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="apellido">Apellido</label>
              <input
                type="text"
                id="apellido"
                name="apellido"
                value={formData.apellido}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={loading}
                className={touched.apellido && errors.apellido ? 'input-error' : ''}
                placeholder="Ej: Pérez"
              />
              {touched.apellido && errors.apellido && (
                <span className="error-message">{errors.apellido}</span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              disabled={loading}
              className={touched.email && errors.email ? 'input-error' : ''}
              placeholder="ejemplo@correo.com"
            />
            {touched.email && errors.email && (
              <span className="error-message">{errors.email}</span>
            )}
            <small className="hint">Debe tener más de 3 caracteres</small>
          </div>

          <div className="form-group">
            <label htmlFor="username">Nombre de Usuario *</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              disabled={loading}
              className={touched.username && errors.username ? 'input-error' : ''}
              placeholder="Ej: juanperez"
            />
            {touched.username && errors.username && (
              <span className="error-message">{errors.username}</span>
            )}
            <small className="hint">Solo letras, números y guiones bajos (3-20 caracteres)</small>
          </div>

          <div className="form-group">
            <label htmlFor="telefono">Teléfono</label>
            <div className="phone-input-wrapper">
              <input
                type="tel"
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={loading}
                placeholder="Ej: +51 912 345 678"
                className={`phone-input ${touched.telefono && errors.telefono ? 'input-error' : ''}`}
                maxLength="20"
              />
              {formData.telefono && !errors.telefono && validatePhone(formData.telefono).isValid && (
                <span className="phone-format-hint valid">
                  ✓ Válido
                </span>
              )}
            </div>
            {touched.telefono && errors.telefono && (
              <span className="error-message">{errors.telefono}</span>
            )}
            <small className="hint">
              Opcional. Ejemplos válidos: 912345678, +51 912 345 678
              <br />
              <strong>No se aceptan:</strong> 0000000, 1234567, 1111111, secuencias o patrones repetitivos
            </small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Contraseña *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                disabled={loading}
                minLength="8"
                className={touched.password && errors.password ? 'input-error' : ''}
                placeholder="••••••••"
              />
              {touched.password && errors.password && (
                <span className="error-message">{errors.password}</span>
              )}
              
              {formData.password && (
                <div className="password-strength">
                  <div className="strength-bar">
                    <div 
                      className="strength-fill"
                      style={{
                        width: `${(passwordStrength.score / 5) * 100}%`,
                        backgroundColor: getStrengthColor()
                      }}
                    ></div>
                  </div>
                  <span className="strength-text" style={{ color: getStrengthColor() }}>
                    Fortaleza: {passwordStrength.level} 
                    {passwordStrength.feedback && ` - ${passwordStrength.feedback}`}
                  </span>
                </div>
              )}
              
              <small className="hint">
                Mínimo 8 caracteres con mayúsculas, minúsculas, números y caracteres especiales
              </small>
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmar Contraseña *</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                disabled={loading}
                className={touched.confirmPassword && errors.confirmPassword ? 'input-error' : ''}
                placeholder="••••••••"
              />
              {touched.confirmPassword && errors.confirmPassword && (
                <span className="error-message">{errors.confirmPassword}</span>
              )}
              <small className="hint">Debe coincidir con la contraseña anterior</small>
            </div>
          </div>

          <button 
            type="submit" 
            className="auth-button primary"
            disabled={loading || !isFormValid()}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Creando cuenta...
              </>
            ) : 'Crear Cuenta'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión aquí</Link>
          </p>
          <p className="terms">
            Al registrarte, aceptas nuestros <Link to="/terms">Términos de Servicio</Link> y <Link to="/privacy">Política de Privacidad</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
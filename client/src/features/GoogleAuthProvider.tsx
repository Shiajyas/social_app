import React, { useEffect } from 'react';
import 'react-toastify/dist/ReactToastify.css';
import { useUserAuth } from '../hooks/useUserAuth';

declare global {
  interface Window {
    google: any;
  }
}

const GoogleAuthProvider = ({ onGoogleSignIn }: { onGoogleSignIn: (user: any) => void }) => {
  const { googleAuthMutation } = useUserAuth();

  const handleGoogleLogin = (response: any) => {
    try {
      const idToken = response.credential;

      //   console.log(idToken,">>>>>>");

      // Send user data to the backend
      googleAuthMutation.mutate({ idToken });

      //   toast.success('Google login successful');
    } catch (error) {
      console.error('Google login failed', error);
      //   toast.error('Google login failed');
    }
  };

  useEffect(() => {
    // Load the Google Identity Services (GIS) library
    // console.log((import.meta as any).VITE_GOOGLE_CLIENT_ID,"client Id");
    
    const initializeGis = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          // client_id: (import.meta as any).VITE_GOOGLE_CLIENT_ID,
         client_id:  "830047924664-uuplt30fb6pcr653s6jj1hm6obaan0c5.apps.googleusercontent.com",
          callback: handleGoogleLogin,
        });

        window.google.accounts.id.renderButton(
          document.getElementById('google-signin-button'),
          { theme: 'outline', size: 'large' }, // Button customization options
        );
      } else {
        console.error('Google API script not loaded');
      }
    };

    initializeGis();
  }, []);

  return <div id="google-signin-button"></div>;
};

export default GoogleAuthProvider;

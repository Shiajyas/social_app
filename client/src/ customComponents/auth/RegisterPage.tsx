import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import { useUserAuth } from '../../hooks/useUserAuth';


const themseOptions = [
  { value: 'fun-emoji', label: 'Fun Emoji' },
  { value: 'pixel-art', label: 'Pixel Art' },
  { value: 'avataaars', label: 'Avataaars' },
  { value: 'bottts', label: 'Bottos' },
  { value: 'identicon', label: 'Identicon' },
  { value: 'initials', label: 'Initials' },
];
const generateAvatarUrl = (username: string,theme:string = 'fun-emoji') => {
  const seed = encodeURIComponent(username.toLowerCase());
  return `https://api.dicebear.com/8.x/${theme}/svg?seed=${seed}`;
};

const RegisterPage = () => {
  const navigate = useNavigate();
  const { registerMutation, isRegisterLoading } = useUserAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    watch,
  } = useForm();

  const username = watch('username');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Generate avatar when username changes
  useEffect(() => {
    if (username) {
      setAvatarUrl(generateAvatarUrl(username));
    }
  }, [username]);


const retryAvatar = () => {
  if (username) {
    const randomTheme =
      themseOptions[Math.floor(Math.random() * themseOptions.length)].value;
    const randomSeed = username + `Random${Math.random().toString(36).substring(2, 5)}`;
    const newAvatarUrl = generateAvatarUrl(randomSeed, randomTheme);
    setAvatarUrl(newAvatarUrl);
  }
};
  const onSubmit = async (data: any) => {
    try {
      const payload = {
        ...data,
        avatar: avatarUrl,
      };
      await registerMutation.mutateAsync(payload);
      navigate('/verify-otp');
    } catch (error) {
      console.error('Error during registration:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 transition-colors">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md transition-all"
      >
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src="/logo.png" alt="Logo" className="w-24 h-24" />
        </div>

        <h3 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-white">
          Register
        </h3>

        {/* Avatar Preview */}
        {username && avatarUrl && (
          <div className="flex flex-col items-center mb-4">
            <img
              src={avatarUrl}
              alt="Generated Avatar"
              className="w-20 h-20 rounded-full border-2 border-gray-300 dark:border-gray-600 shadow"
            />
            <button
              type="button"
              onClick={retryAvatar}
              className="mt-2 text-sm text-blue-500 hover:underline"
            >
              Retry Avatar
            </button>

          </div>
        )}

        {/* Loading Indicator */}
        {isRegisterLoading && (
          <div className="flex justify-center items-center mb-6">
            <div className="spinner-large"></div>
          </div>
        )}

        {/* Input Fields */}
  {[
  { name: 'fullname', label: 'Full Name' },
  { name: 'username', label: 'Username', autoComplete: 'new-username' },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'new-email' },
  { name: 'password', label: 'Password', type: 'password', autoComplete: 'new-password' },
  { name: 'confirmPassword', label: 'Confirm Password', type: 'password', autoComplete: 'new-password' },
].map(({ name, label, type = 'text', autoComplete = 'off' }) => (
  <div key={name} className="mb-4">
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
      {label}
    </label>
    <input
      type={type}
      autoComplete={autoComplete}
      className={`w-full px-3 py-2 border rounded-md focus:outline-none bg-white dark:bg-gray-700 text-black dark:text-white
        ${errors[name] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
      `}
      {...register(name, {
        required: `${label} is required`,
        ...(name === 'confirmPassword'
          ? {
              validate: (value: string) =>
                value === getValues('password') || 'Passwords do not match',
            }
          : {}),
      })}
    />
    {errors[name] && (
      <small className="text-red-500">{errors[name]?.message as string}</small>
    )}
  </div>
))}

        {/* Gender */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Gender
          </label>
          <div className="flex items-center space-x-4 mt-1 text-gray-800 dark:text-white">
            {['male', 'female'].map((gender) => (
              <label key={gender} className="flex items-center space-x-2">
                <input
                  type="radio"
                  value={gender}
                  {...register('gender', { required: 'Gender is required' })}
                />
                <span className="capitalize">{gender}</span>
              </label>
            ))}
          </div>
          {errors.gender && (
            <small className="text-red-500">{errors.gender?.message as string}</small>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-300"
          disabled={isRegisterLoading}
        >
          {isRegisterLoading ? 'Registering...' : 'Register'}
        </button>

        {/* Footer */}
        <p className="text-center mt-4 text-gray-700 dark:text-gray-300">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-500 hover:underline">
            Login Now
          </Link>
        </p>
      </form>
    </div>
  );
};

export default RegisterPage;

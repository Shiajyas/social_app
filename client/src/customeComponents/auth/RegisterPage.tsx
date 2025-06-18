import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import { useUserAuth } from '../../hooks/useUserAuth';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { registerMutation, isRegisterLoading } = useUserAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm();

  const onSubmit = async (data: any) => {
    try {
      await registerMutation.mutateAsync(data);
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

        {/* Loading Indicator */}
        {isRegisterLoading && (
          <div className="flex justify-center items-center mb-6">
            <div className="spinner-large"></div>
          </div>
        )}

        {/* Input Field Component Generator */}
        {[
          { name: 'fullname', label: 'Full Name' },
          { name: 'username', label: 'Username' },
          { name: 'email', label: 'Email', type: 'email' },
          { name: 'password', label: 'Password', type: 'password' },
          { name: 'confirmPassword', label: 'Confirm Password', type: 'password' },
        ].map(({ name, label, type = 'text' }) => (
          <div key={name} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              {label}
            </label>
            <input
              type={type}
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

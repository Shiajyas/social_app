import { useNavigate } from "react-router-dom";

export  const GroupWelcomePage = () => {
    let navigate = useNavigate();
    return (
    <div className="flex flex-col items-center justify-center h-full px-4 text-center relative overflow-hidden 
      bg-gradient-to-br from-blue-50 via-white to-purple-100 
      dark:from-gray-900 dark:via-gray-800 dark:to-black
      transition-colors duration-500 ease-in-out"
    >

      {/* Animated cartoon image */}
      <img
        src="https://www.animatedimages.org/data/media/209/animated-cat-image-0072.gif"
        alt="Welcome Doodle"
        className="w-full max-w-sm md:max-w-md mb-8 animate-bounce"
      />

      {/* Heading */}
      <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white animate-slide-in-down">
        Welcome to PingPod
      </h1>

      {/* Subheading */}
      <p className="mt-4 text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl animate-fade-in-up">
        Connect with communities, share ideas, and start meaningful conversations.<br />
        <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Select</span> a chat group or <span className="text-indigo-600 dark:text-indigo-400 font-semibold">create</span> your own to begin the journey.
      </p>

      {/* Call to action */}
      <div className="mt-8 flex gap-4 animate-fade-in-up">
        <button
          onClick={() => navigate('/home/community/create')}
          className="px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition text-white shadow-lg dark:shadow-indigo-800"
        >
          Create a Group
        </button>
      </div>
    </div>
  );
} 
import React from 'react';

interface ErrorModalProps {
  message: string;
  onClose: () => void;
}

const ErrorModal: React.FC<ErrorModalProps> = ({ message, onClose }) => {
    return (
        // <div className="fixed inset-0 flex items-center justify-center z-50">
        //   <div className="relative inset-0 bg-black opacity-50"></div>
        //     <div className="z-50 bg-gray-800 text-white rounded-lg p-8 max-w-md">
        //     <span className="absolute top-0 right-0 m-4 cursor-pointer text-white" onClick={onClose}>&times;</span>
        //     <p className="text-lg">{message}</p>
        //   </div>
        // </div>
    <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="fixed inset-0 bg-black opacity-50"></div>
        <div id="alert-2" className="z-50 flex items-center p-4 mb-4 text-white rounded-lg opacity-100 bg-gray-800 dark:bg-gray-800 dark:text-red-400" role="alert">
            <svg className="flex-shrink-0 w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z"/>
            </svg>
            <span className="sr-only">Error</span>
            <div className="ms-3 text-sm font-medium">
                {message}
            </div>
            <button type="button" onClick={onClose} className="ml-4 ms-auto -mx-1.5 -my-1.5 bg-red-50 text-red-500 rounded-lg focus:ring-2 focus:ring-red-400 p-1.5 hover:bg-red-200 inline-flex items-center justify-center h-8 w-8 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-gray-700" data-dismiss-target="#alert-2" aria-label="Close">
                <span className="sr-only">Close</span>
                <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                </svg>
            </button>
        </div>
    </div>
      );


};

export default ErrorModal;

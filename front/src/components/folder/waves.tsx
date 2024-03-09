import React, { useEffect, useRef } from 'react';
import './waves.css';

const AnimatedWaves: React.FC = () => {
    return(
    <div>
        <div className="wave oceanic">
          <svg version="1.1" id="oceanic_wave" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
           viewBox="0 0 1710.3 261" xmlSpace="preserve">
      
            <linearGradient id="oceanic_gradient" gradientUnits="userSpaceOnUse" x1="855.1273" y1="261.0422" x2="855.1273" y2="182.7099">
              <stop offset="0" style={{ stopColor: '#2B1028' }} />
              <stop className="oceanic_stop" offset="0.9962" stopColor='#2B1028' style={{ stopColor: '#0044BB' }} />
            </linearGradient>
    
            <path id="oceanic_wave_1" className="oceanic_wave_1" d="M1552.5,261H158.2c-6.5,1,59.5-59.5,191.7-64.3c92.6-3.4,121,12.9,242.2,8.4
            c63.9-2.4,142.4-36.6,250.2-15.6c79.9,15.6,181.9,48.4,234.3,52.7c71.7,5.9,279.6-2.8,327.4-4.8C1404,237.4,1533.4,232,1552.5,261z" />
            <linearGradient id="oceanic_gradient" gradientUnits="userSpaceOnUse" x1="854.4721" y1="261.0583" x2="854.4721" y2="160.914">
              <stop offset="0" style={{ stopColor: '#2B1028' }} />
              <stop className="oceanic_stop" offset="0.9962" style={{ stopColor: '#004466' }} />
            </linearGradient>
            <path id="oceanic_wave_2" className="oceanic_wave_1"  d="M1552.5,261H158.2c-6.5,1-1.2-24.1,131-28.9c92.6-3.4,160-6,217-8
            c63.9-2.2,163-11,242-19c85.6-8.7,155.3-48.1,253-36c170,21,305-4,386-8C1387.1,161.1,1518.1,152.1,1552.5,261z" />
            <linearGradient id="oceanic_gradient" gradientUnits="userSpaceOnUse" x1="854.4026" y1="261.0424" x2="854.4026" y2="197.8353">
              <stop offset="0" style={{ stopColor: '#2B1028' }} />
              <stop className="oceanic_stop" offset="0.9962" style={{ stopColor: '#004466' }} />
            </linearGradient>
            <path id="oceanic_wave_3" className="oceanic_wave_1"  d="M1552.5,261H158.2c-6.5,1-3.2-58.1,129-62.9c92.6-3.4,162,28,219,26
            c63.9-2.2,163-11,242-19c85.6-8.7,155.3,25.8,253,14c170.1-20.5,294-14,391-14C1392.1,205.1,1523.1,206.1,1552.5,261z" />
          </svg>
        </div>
    </div>
    );
}
  
  export default AnimatedWaves;
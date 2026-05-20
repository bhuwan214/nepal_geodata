import { NavLink } from "react-router"
import { GiForest } from "react-icons/gi";
import { IoMenu } from "react-icons/io5";



export default function Navbar() {
  return (
    <div className="navbar-container relative z-20 flex items-center justify-between px-3">
       <div className=" logo-part px-4 py-4 text-center">   <GiForest /> </div>
        <div className="routes">


         <NavLink to="/" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900">Protected Areas</NavLink>
        <NavLink to="/directory" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900">Species Directory</NavLink>
        <NavLink to="/map" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900">Interactive Map</NavLink>
        <NavLink to="/resources" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900">Resources</NavLink>
    
            
        </div>
        <div className="buttons"> <IoMenu /> </div>
      
    </div>
  )
}

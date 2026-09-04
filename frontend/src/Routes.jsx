import React, { useEffect } from "react";
import {useNavigate, useRoutes} from 'react-router-dom'
import { useAuth } from "./authContext.jsx";

import Dashboard from "./components/dashboard/Dashboard.jsx";
import Profile from "./components/user/Profile.jsx";
import Login from "./components/auth/Login.jsx";
import Signup from "./components/auth/Signup.jsx";
import Form from "./components/repo/Form.jsx";
import Repo from "./components/repo/Repo.jsx";


const ProjectRoutes = () => {
    const {currentUser, setCurrentUser} = useAuth();
    const navigate = useNavigate();

    useEffect(()=>{
        const userIdFromStorage = localStorage.getItem("userId");

        if(userIdFromStorage && !currentUser){
            setCurrentUser(userIdFromStorage);
        }
        if(!userIdFromStorage && !["/auth", "/signup"].includes(window.location.pathname)) {
            navigate("/auth");
        }

        if(userIdFromStorage && window.location.pathname=='/auth'){
            navigate("/");
        }
    }, [currentUser, navigate, setCurrentUser]);

    let element = useRoutes([
        {
            path:"/",
            element:<Dashboard/>
        },
        {
            path:"/auth",
            element:<Login/>
        },
        {
            path:"/signup",
            element:<Signup/>
        },
        {
            path:"/profile/:id",
            element:<Profile/>
        },
        {
            path:"/profile/:id/issues",
            element:<Profile Pagetype="issues"/>
        },
        {
            path:"/profile/:id/staredrepository",
            element:<Profile Pagetype="starred"/>
        },
        {
            path:"/create",
            element:<Form/>
        },
        {
            path:"/repo/:id",
            element:<Repo/>
        }
    ]);

    return element;
}

export default ProjectRoutes;
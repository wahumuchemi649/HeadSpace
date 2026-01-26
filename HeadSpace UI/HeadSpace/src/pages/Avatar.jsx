import React from "react";

const Avatar =({name})=>{
    const getInitials =(fullName)=>{
        if(!fullName) return '?'
    const parts = fullName.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();

    // first letter + last letter
    return (
      parts[0][0].toUpperCase() + parts[parts.length - 1][0].toUpperCase()
    );

    }
    const initials = getInitials(name);

  return (
    <div className="avatarCircle">
      {initials}
    </div>
  );

}

export default Avatar;
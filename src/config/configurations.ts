// src/configurations.ts
export default () => {  
    return {
        appRoles: JSON.parse(process.env.ROLES),
    };
  };
  
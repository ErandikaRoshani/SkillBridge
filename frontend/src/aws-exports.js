const awsconfig = {
  Auth: {
    Cognito: {
      userPoolId: "ap-southeast-1_HEjAi0uZX",        // your User Pool ID
      userPoolClientId: "5st9qokl4ltc3qeikucqvn34n8",   // your App Client ID
      loginWith: {                           // how users log in
        email: true,
        phone: false,
        username: false
      }
    },
    OAuth: {
      domain: "ap-southeast-1hejai0uzx.auth.ap-southeast-1.amazoncognito.com", 
      scope: ["openid", "email", "profile"],
      redirectSignIn: ["http://localhost:3000/"],
      redirectSignOut: ["http://localhost:3000/"],
      responseType: "code"
    }
  }
};

export default awsconfig;

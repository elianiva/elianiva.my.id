with import <nixpkgs> {};

stdenv.mkDerivation {
  name = "elianiva.my.id";
  buildInputs = [
    nodejs-14_x
  ];
  shellHook = ''
    export PATH="$PWD/node_modules/.bin/:$PATH"
    alias start="npm start"
    alias dev="npm run dev"
    alias update="npm update --latest"
    alias uninstall="npm uninstall"
    alias install="npm install"
    alias format="npm run prettier"
  '';
}

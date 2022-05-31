{ pkgs ? import <nixpkgs> { } }:

with pkgs;

mkShell {
  buildInputs = [
    stdenv
    nodejs
    yarn
    docker
  ];
}

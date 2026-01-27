{
  description = "Development environment with Go";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
      ...
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs {
          inherit system;
        };
      in
      rec {

        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            nodejs_24

            nixfmt-tree
            nixfmt-rfc-style
            nixd
          ];
        };

        # `nix fmt` will use this
        formatter = pkgs.nixfmt-rfc-style;
      }
    );
}

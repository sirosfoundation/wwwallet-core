group "default" {
  targets = ["wwwallet-issuer-poc"]
}

target "docker-metadata-action" {}

target "wwwallet-issuer-poc" {
  inherits = ["docker-metadata-action"]
}

target "release" {
  inherits = ["docker-metadata-action"]
  platforms = ["linux/amd64", "linux/arm64"]
}
# Vagrant file for provisioning Bootlegger Server Dev Environment
# Run: 
#   vagrant up
#
# Website will be accessible on port localhost:8080
# Mongo is accessible on port 27018
#
# You will need to edit your AWS, Google and Facebook credentials in
#   /vagrant/config/local.js
#
# To restart server:
#   vagrant ssh
#   pm2 restart app


# -*- mode: ruby -*-
# vi: set ft=ruby :
Vagrant.configure(2) do |config|
  config.vm.hostname = "Bootlegger Server"
  config.vm.box = "ubuntu/trusty64"
  config.vm.hostname ="bootlegger-dev"
  config.vm.provider "virtualbox" do |v|
    v.memory = 1024
  end
  config.vm.provider "virtualbox" do |v|
    v.customize ["setextradata", :id, "VBoxInternal2/SharedFoldersEnableSymlinksCreate/vagrant", "1"]
  end
  config.vm.provider "virtualbox" do |v|
    v.customize ["setextradata", :id, "VBoxInternal2/SharedFoldersEnableSymlinksCreate/v-root", "1"]
  end
  config.vm.network "forwarded_port", guest: 1337, host: 1337, auto_correct:true
  config.vm.network "forwarded_port", guest: 27017, host: 27018, auto_correct:true
  config.vm.network "forwarded_port", guest: 11300, host: 11300, auto_correct:true
  config.vm.network "private_network", ip: "192.168.50.1", virtualbox__intnet: true do |n|
    config.vm.provider "virtualbox" do |v|
        v.customize ["modifyvm", :id, "--nicpromisc#{n.id}", "allow-all"]
      end
    end
  config.ssh.shell = "bash -c 'BASH_ENV=/etc/profile exec bash'"
  config.vm.provision :shell, path: "bootstrap.sh"
  config.vm.post_up_message = "Bootlegger Server Development Environment Started. View the README.md file for more information."
end

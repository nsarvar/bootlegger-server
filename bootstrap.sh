#!/usr/bin/env bash
export DEBIAN_FRONTEND=noninteractive
#sudo -sHu vagrant env
swapsize=512 

# does the swap file already exist? 
grep -q "swapfile" /etc/fstab 
# if not then create it 
if [ $? -ne 0 ]; then 
 	echo 'Swapfile not found. Adding swapfile.' 
 	fallocate -l ${swapsize}M /swapfile 
 	chmod 600 /swapfile 
 	mkswap /swapfile 
 	swapon /swapfile 
 	echo '/swapfile none swap defaults 0 0' >> /etc/fstab 
 fi 


if ! node -v > /dev/null 2>&1; then

	#add repos
	add-apt-repository -y ppa:chris-lea/redis-server 
	
	# Update apt-get to get 10gen stable packages
	apt-key adv --keyserver keyserver.ubuntu.com --recv 7F0CEB10
	echo 'deb http://downloads-distro.mongodb.org/repo/ubuntu-upstart dist 10gen' | tee /etc/apt/sources.list.d/10gen.list
	apt-get update -q
	apt-get install -q -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" \
		python-software-properties git python g++ make redis-server mongodb-10gen=2.4.4 beanstalkd htop
		
	curl --silent --location https://deb.nodesource.com/setup_0.12 | sudo bash -
	apt-get install --yes nodejs

fi

#defaut passwords / add default config file from copy
if ! [ -e /vagrant/config/local.js ]; then
  echo 'Copying default Bootlegger settings.' 
  cp /vagrant/config/local.example /vagrant/config/local.js
fi
#setup app config

#exit 0;	

# run npm install
(
    #rm -rf /vagrant/node_modules &&
	echo 'Installing node dependencies' 
	mkdir -p /opt/app/node_modules &&
	mkdir -p /vagrant/node_modules &&
	mount -o bind /opt/app/node_modules /vagrant/node_modules &&
	chown vagrant:vagrant /vagrant/node_modules &&
	cd /vagrant &&
	sudo -sHu vagrant npm cache clean && 
	sudo -sHu vagrant npm install
	npm install -g pm2
	echo 'Spinning up App' 
	sudo -sHu vagrant pm2 start app.js
	pm2 startup ubuntu
)

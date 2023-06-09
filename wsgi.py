#!/usr/bin/python
import sys
import logging
logging.basicConfig(stream=sys.stderr)
sys.path.insert(0,"/home/ubuntu/supermana.world/")
sys.path.insert(0,"/home/ubuntu/supermana.world/venv/lib/python3.10/site-packages")
from supermana_world.app import app as application
application.secret_key = "608436f942382b79b5b7ca43dece041d5b80d51cfc68c685a67a569addc1a0ef"


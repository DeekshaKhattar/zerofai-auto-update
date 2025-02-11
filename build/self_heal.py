import subprocess
import requests
import base64
import json
import sys
import io,shutil,glob
import os,time
from pathlib import Path
import socket,time
import win32api
import win32security
import csv
from getmac import get_mac_address as gma
from datetime import datetime
import ssl
import winreg as reg
import winreg
import platform,os,logging
from dotenv import load_dotenv

load_dotenv()
path = os.getenv("LOG_FILE_PATH_86")
if os.path.exists(path):
    log_file = path
else:
    log_file = os.getenv("LOG_FILE_PATH")

logging.basicConfig(filename=log_file, level=logging.INFO)

def clean_and_convert(data):
    cleaned_data = {}
    for key, value in data.items():
        # Strip whitespace and newline characters
        value = value.strip()
        # Convert "True" and "False" to boolean
        if value == 'True':
            cleaned_data[key] = True
        elif value == 'False':
            cleaned_data[key] = False
        else:
            cleaned_data[key] = value
    return cleaned_data

def run_powershell_command(command):
    # Define the PowerShell script
    powershell_script = f"""{command}"""

    # Run the PowerShell script using subprocess
    result = subprocess.run(["powershell", "-Command", powershell_script], capture_output=True, text=True)
    # Check the result
    if result.returncode == 0:
        # logging.info(result.stdout.strip())
        if result.stdout.strip() == '1':
            return True
        elif result.stdout.strip() == '0':
            return False
        else:
            return result.stdout.strip()
    else:
        return f"Error: {result.stderr.strip()}"
    
def run_python_command(command):
    if "{{USERPATH}}" in command:
        user_profile_path = os.getenv("USER_PROFILE_PATH").replace("\\", "\\\\")
        command = command.replace("{{USERPATH}}", user_profile_path)
    output_stream = io.StringIO()
    sys.stdout = output_stream
    try:
        exec(command)
    except Exception as e:
        output_result = f"Error executing command: {e}"
        logging.error(f"Error executing command: {e}{command}")
    else:
        output_result = output_stream.getvalue()
    sys.stdout = sys.__stdout__
    logging.info(f"{datetime.now()}Output of the code:{output_result}")
    return output_result
    
def xor_encrypt(data, key):
    encrypted = ''
    for i in range(len(data)):
        encrypted += chr(ord(data[i]) ^ ord(key[i % len(key)]))
    return base64.b64encode(encrypted.encode('utf-8')).decode('utf-8')

def call_selfheal_parameters():
    auth_key = xor_encrypt(data_to_encrypt, key)
    selfheal_check_data = {}
    print(auth_key)
    headers = {
        'Authorization': auth_key,
        'Content-Type': 'application/json'
    }
    response = requests.get(get_params_api_url, headers=headers, verify=ssl.CERT_NONE)
    logging.info(response.status_code,response.text)
    if response.json().get('total_count'):
        for parameter in response.json()['results']:
            try:
                if parameter['type'] == 'python':
                    print(parameter['parameter_name'])
                    logging.info(f"{datetime.now()}parameter:{parameter['parameter_name']}")
                    selfheal_check_data[parameter['parameter_name']] = run_python_command(parameter['command'])
                else:
                    selfheal_check_data[parameter['parameter_name']] = run_powershell_command(parameter['command'])
            except Exception as e:
                logging.error(f"{datetime.now()}Error in parameter {parameter['parameter_name']}: {str(e)}")
                continue

        cleaned_data = clean_and_convert(selfheal_check_data)
        payload = json.dumps({
            "hostname":  socket.gethostname(),
            "selfheal_data" : cleaned_data
        })
        response = requests.post(post_params_api_url, headers=headers, data=payload, verify=ssl.CERT_NONE)
        logging.info(response.status_code,response.json())
        print(cleaned_data)
        logging.info(cleaned_data)
        logging.info(f"{datetime.now()}cleaned_data,{cleaned_data}")
    else:
        print(f"{datetime.now()}No parameters found")

# Call the function and logging.info the result
# def main():
#     try:
#         call_selfheal_parameters()
#     except Exception as e:
#         logging.error(f"{datetime.now()}An error occurred: {str(e)}")

url=os.getenv("URL")
get_params_api_url = url+"/portal/api/v1/selfheal/configuration"
post_params_api_url = url+"/portal/api/v1/selfheal/"
data_to_encrypt = os.getenv("data_to_encrypt")
key = os.getenv("key")

# Call the main function
# main()
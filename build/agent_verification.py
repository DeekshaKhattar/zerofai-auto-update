import os
import json
import subprocess
import socket
import requests,base64
from getmac import get_mac_address as gma
from dotenv import load_dotenv
load_dotenv()

# Function to get the hostname
def get_hostname():
    return socket.gethostname()

def xor_encrypt(data, key):
    encrypted = ''
    for i in range(len(data)):
        encrypted += chr(ord(data[i]) ^ ord(key[i % len(key)]))
    return base64.b64encode(encrypted.encode('utf-8')).decode('utf-8')

# Function to get the ZerofAI version
def get_zerofai_version():
    try:
        result = subprocess.check_output(
            ['powershell', '-command', "(Get-Item 'C:\\Program Files\\ZerofAI\\ZerofAI.exe').VersionInfo.ProductVersion"], 
            stderr=subprocess.DEVNULL, 
            text=True
        ).strip()
        return result
    except subprocess.CalledProcessError:
        return None

# Function to check if ZerofAIService exists and get its status
def check_zerofai_service():
    try:
        service_info = subprocess.run(
            ['sc', 'query', 'ZerofAIService'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        if 'RUNNING' in service_info.stdout:
            return True, "running"
        else:
            return True, "stopped"
    except Exception:
        return False, "stopped"

# Function to get Python paths
def get_python_paths():
    try:
        paths = subprocess.check_output(
            ['where', 'python'], 
            stderr=subprocess.DEVNULL, 
            text=True
        ).strip().splitlines()
        return "; ".join(paths)
    except subprocess.CalledProcessError:
        return None

# Function to check the existence of a task in Task Scheduler
def check_task(task_name):
    try:
        task_info = subprocess.check_output(
            ['schtasks', '/query', '/tn', task_name, '/fo', 'list', '/v'], 
            stderr=subprocess.DEVNULL, 
            text=True
        ).strip()
        return task_info
    except subprocess.CalledProcessError:
        return None

# Main function to gather all data and send it to the API
def gather_system_info():
    hostname = get_hostname()
    zerofai_version = get_zerofai_version()
    zerofai_service_exists, zerofai_service_status = check_zerofai_service()
    python_paths = get_python_paths()

    # Task names to check
    task_names = [
        "System Health Check Task 1.1",
        "System Health Check Task 1.2",
        "Compliance Check Task",
        "Self Heal Task",
        "ZerofAI Log Refresh Task",
        "ZerofAI Verification 1.1",
        "ZerofAI Verification 1.2"
    ]

    tasks_details = {}
    for task_name in task_names:
        task_info = check_task(task_name)
        if task_info:
            tasks_details[task_name] = str(task_info)
        else:
            tasks_details[task_name] = "Task not found."

    # Create final JSON structure
    system_info = {
        "hostname": hostname,
        "mac_address" : gma(),
        "agent_data": {
            "zerofai_version": zerofai_version,
            "zerofai_service_exists": zerofai_service_exists,
            "zerofai_service_status": zerofai_service_status,
            "python_paths": python_paths,
            "tasks": tasks_details
        }
    }

    # Output JSON to file for debugging purposes
    with open('payload.json', 'w') as outfile:
        json.dump(system_info, outfile, indent=4)

    # Display JSON
    print(json.dumps(system_info, indent=4))
    auth_key = xor_encrypt(data_to_encrypt, key)
    print(auth_key)
    # Hit the API with the payload
    headers = {'Content-Type': 'application/json',
               'Authorization': auth_key,
               }
    response = requests.post(
        os.getenv("URL")+'/portal/api/v1/agent/verification/',
        headers=headers,
        data=json.dumps(system_info)
    )

    # Print API response
    print("API Response:", response.status_code,)

data_to_encrypt = os.getenv("data_to_encrypt")
key = os.getenv('key')
if __name__ == "__main__":
    gather_system_info()
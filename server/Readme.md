# Setting up a Virtual Environment and Installing Requirements

## Setting up a Virtual Environment

1. Open a terminal and navigate to your project directory:
    ```sh
    cd /path/to/your/directory
    ```

2. Create a virtual environment:
    ```sh
    python -m venv venv
    3. Create a `.env` file in the root of your project directory and add your environment-specific variables. For example:
        ```sh
        touch .env
        ```

    4. Open the `.env` file and add your configuration details:
        ```sh
        FLASK_RUN_PORT=<PORT NUMBER >
        DATABASE_USERNAME=<DB USERNAME>
        DATABASE_PASSWORD=<DB PASSWORD>
        DATABASE_HOST=<DB HOST>
        DATABASE_PORT=<DB PORT>
        DATABASE_NAME=<DB NAME>
        ```

3. Activate the virtual environment:
    - On Windows:
        ```sh
        venv\Scripts\Activate
        ```
    - On macOS/Linux:
        ```sh
        source venv/bin/activate
        ```

## Installing Requirements

1. Ensure you are in the virtual environment (you should see `(venv)` in your terminal prompt).

2. Install the required packages:
    ```sh
    pip install -r requirements.txt
    ```

3. Verify the installation:
    ```sh
    pip list
    ```

You have now set up a virtual environment and installed the necessary requirements for your project.
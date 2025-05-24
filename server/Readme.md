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
        FLASK_RUN_PORT=<PORT_NUMBER >
        SECRET_KEY=your_secret_key
        JWT_SECRET_KEY=your_jwt_secret_key
        SQLALCHEMY_DATABASE_URI=postgresql://username:password@localhost/databse_name

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


run the command 
```sh 
python app.py 
```
to run the server

the prefix for auth features is /auth , so when sending the post request , the url will be /auth/signup or /auth/login .

the body for the post request will be 
```sh
{
  "username": "john_doe",
  "email": "john@example.com",
  "mPin": "1234"


### Request OTP Endpoint

- **URL**: `/auth/request-otp`
- **Method**: `POST`
- **Description**: This endpoint is used to request a One-Time Password (OTP) for user verification.
- **Request Body**:
    ```json
    {
      "username": "john_doe",
      "email": "john@example.com"
    }
    ```
- **Response**:
    - Success: Returns the OTP sent to the user's email.
    - Failure: Returns an error message if the OTP request fails.

## Verify OTP Endpoint

### Verify OTP Endpoint

- **URL**: `/auth/verify-otp`
- **Method**: `POST`
- **Description**: This endpoint is used to verify the OTP sent to the user.
- **Request Body**:
    ```json
    {
      "username": "john_doe",
      "otp": "123456"
    }
    ```
- **Response**:
    - Success: Returns a success message if the OTP is verified successfully.
    - Failure: Returns an error message if the OTP verification fails.

## Reset MPIN Endpoint

### Reset MPIN Endpoint

- **URL**: `/auth/reset-mpin`
- **Method**: `POST`
- **Description**: This endpoint is used to reset the user's MPIN.
- **Request Body**:
    ```json
    {
      "username": "john_doe",
      "email": "john@example.com",
      "new_mPin": "5678"
    }
    ```
- **Response**:
    - Success: Returns a success message if the MPIN is reset successfully.
    - Failure: Returns an error message if the MPIN reset fails.
}
```


"""
This function/class/module is responsible for [provide a brief description of its purpose and functionality].

Note:
- In case of any changes to the model, ensure to run the following commands to apply the changes to the database:
    1. `flask db migrate -m"message"` - Generates a new migration script based on the changes.
    2. `flask db upgrade` - Applies the migration script to the database.
"""
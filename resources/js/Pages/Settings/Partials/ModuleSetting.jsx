import React from 'react';
import { useEffect, useState } from 'react';
import { Button,  Grid, CardContent, Typography, CardActions } from '@mui/material';
import Card from '@mui/material/Card';
import { SnackbarProvider, useSnackbar } from 'notistack';

const App = ({ handleSubmit, settingFormData, setSettingFormData, settings }) => {
    const modules_list = ['Cheques', 'Reloads','Inventory','Catalog POS'];
    const [activatedModules, setActivatedModules] = useState(settings.modules ? settings.modules.split(',') : []);
    const { enqueueSnackbar } = useSnackbar();

    const handleActivate = async (module) => {
        try {
            const response = await axios.post('/settings/module/activate', { module });
            setActivatedModules([...activatedModules, module]);
            enqueueSnackbar('Module activated successfully!', { variant: 'success' });
        } catch (error) {
            enqueueSnackbar('Failed to activate module.', { variant: 'error' });
        }
    };

    const handleDeactivate = async (module) => {
        try {
            const response = await axios.post('/settings/module/deactivate', { module });
            setActivatedModules(activatedModules.filter(m => m !== module));
            enqueueSnackbar('Module deactivated successfully!', { variant: 'success' });
        } catch (error) {
            enqueueSnackbar('Failed to deactivate module.', { variant: 'error' });
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            method="post"
        >
            <Grid container spacing={2} size={12} width={'100%'}>
                {modules_list.map((module) => (
                    <Grid size={{ xs: 6, sm: 3, md: 2 }} key={module} justifyContent={'center'}>
                        <Card>
                            <CardContent>
                                <p className='text-lg'>{module}</p>
                            </CardContent>
                            <CardActions>
                                {activatedModules.includes(module) ? (
                                    <Button size="large" color="error" onClick={() => handleDeactivate(module)}>
                                        Deactivate
                                    </Button>
                                ) : (
                                    <Button size="large" color="primary" onClick={()=>handleActivate(module)}>
                                        Activate
                                    </Button>
                                )}
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </form>
    );
};

export default function ModuleSetting(props) {
    return (
      <SnackbarProvider maxSnack={3}>
        <App {...props}/>
      </SnackbarProvider>
    );
  }